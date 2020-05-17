---
comments: true
title: Bloomier Filters (Part 1)
mathjax: true
---

## Motivation

Suppose you are a librarian, collecting 20th century literature. Not in a physical
library of course -- you manage a database of billions of books, which has to service requests
from millions of people per second. To be able to do this, you have a central
database which processes requests, and $$R$$ secondary databases which actually
store the books' contents. When the central database receives a request for a particular
book title, it reroutes the request to the whichever database that the book is stored in.

The central database is the one under the most load here, since it receives *every* request.
The mapping of books to database not only needs to be able to do $$O(1)$$ lookups, 
it also needs to be able to reject books that
aren't in any database, and ideally, it needs to be compacted
into as little memory as possible. If the title
of a book is around 30 bytes long, a naïve hash table might require 30 bytes per entry!
Surely we can do better!

In the case $$R=1$$, (you only have one secondary database), the central database only
needs to accept or reject books, depending on if they are in the database. What you want here is
an ordinary *Bloom filter*. Roughly speaking, a Bloom filter probabilistically determines whether
a particular item is in a precomputed set using a hash function. This article won't assume knowledge
of Bloom filters, but you should definitely check them out. When $$R > 1$$, what we want is not
to store a set but to store a map. This generalization of Bloom filters is called
the Bloomier filter.

## The Birthday Paradox, and Hash Collisions

Let's look again at why a naïve hash table is inefficient. To review, we assume that we
have some hash function $$h : \mathcal{B}\mapsto \{0, 1\}^\infty$$, where $$\mathcal{B}$$ is the set of possible book
titles and $$\{0, 1\}^\infty$$ is an infinite stream<span class="footnote">In practice, we will need only finitely many (e.g. ~128 bits)</span>
of random<span class="footnote">In reality, they are pseudorandom of course</span> bits.
With a hash table, we create a table of size $$m$$ (here, $$m$$ is
some tuneable parameter), and add each book-database pair $$(B, r)$$ to the list stored at `table[hash(B)]`,
where `hash(B)` consumes $$\log_2 m$$ bits from the hash function $$h$$ to generate an
integer in the range $$[0, m)$$.

This works very well for most applications, and is a simple, efficient approach. However, we always end up needing
a collision resolution mechanism, and this makes the memory footprint of our table rather large.
For the sake of simplicity, suppose we are storing $$n = \vert \mathcal{B}\vert=10$$ books
into $$R=5$$ databases with a table size of $$m=20$$. Naïvely, you might think you only need $$m = O(n)$$ slots in the table
in order to have a good chance of avoiding collisions, but this is not true. (In our simulation, we get no collisions only 6% of the time!
Try it out!)

<div class="animation" data-anim="birthdayHashCollision">
<div>
<button class="btn btn-info desc-btn">Description (click to show)</button>
<div class="description">The simulation produces random hashes for every book and checks for duplicates. They're more frequent than you might think!</div>
</div>
<div class="success">It worked this time, but usually there is a collision</div>
<table>
<tr><th>Book title</th><th>Hash</th></tr>
</table>
</div>

In fact, you need to have $$m = O(n^2)$$ in order to have a good chance of avoiding collisions. This is related to the "birthday
paradox," where in a group of only around $$\sqrt{365}\approx 20$$, there is already over a $40\%$ chance of some two people sharing a birthday.
We won't prove this formally here, but intuitively, this is because there are $$\binom{n}{2}=O(n^2)$$ pairs of books. Therefore, if we want to avoid
collisions between any two books, the chance of a collision for a particular pair should be on the order of $$1/n^2$$, so we would need
$$m = O(n^2)$$ table entries. This takes up far too much memory.

On the other hand, if we use only $$m = O(n)$$ entries, it is very likely that there will be many collisions. To resolve this in the standard way,
we would at the very least need to have each entry of the table be a pointer to a list, which already requires 8 bytes per entry on a 64-bit system.
Moreover, every element of the list would have to store either the title itself (30 bytes!), or 
an independent hash of its title, which is another $$\log m$$ bits, and $$\log R$$ bits to indicate
which databasae the book is in. In total, we might need 12-16 bytes per table entry, which is quite wasteful.

## Just add some choice!

Ultimately, the insight that Bloomier filters provide is that we can actually map each element to a unique hash value -- if we provide just a little choice.
Here, we use $$k=2$$ hash choices for each element, and we pick one of the two hashes for each element such that every element is associated
with a unique hash. This works over 90% of the time in our simulation!

<div class="animation" data-anim="twoChoicesHash">
<div>
<button class="btn btn-info desc-btn">Description (click to show)</button>
<div class="description">The simulation produces two random hashes for each book. It then goes back and tries to choose a "critical hash"
for each one such that no two books have the same critical hash</div>
</div>
<div class="success">Success!</div>
<div class="failure">Error: could not choose a unique hash for each book</div>
<table>
<tr><th>Book title</th><th>Hash 1</th><th>Hash 2</th></tr>
</table>
</div>

Now, all we need to do is figure out a way to remember which of the two hashes each element is associated with! If we could do that, we would get
a unique hash associated with each element, so it would be quite easy to associate every element with an entry in the table; we wouldn't need any collision
resolution mechanism -- we could just set `T[h_c(elem)]=val`, where `T` is the table, `h_c` is either `h0` or `h1` depending on which one was the "critical hash"
and `val` is the value we want to associate with `elem`.
Unfortunately, to be able to remember whether we chose the first hash or the second hash for each element, we would need some sort of map structure...
which was exactly what we were trying to solve in the first place. But this is still good progress, and we will return to the idea later.

Instead, we come to the biggest insight of Bloomier filters: we don't want to store which hash was the critical hash,
so instead we will use all of the hashes to store each element. That way, once we create the table, we can completely forget about
which hash was the critical hash for each book. For example, we might try to make `T[h0(elem)] + T[h1(elem)]`
equal to `val`. Then, when we look up `elem`, we don't actually need to know which hash we chose to be the "critical hash."

How do we use the critical hash then? The idea is this: every time we add an element `elem` to the table, 
we will only change *either* `T[h0(elem)]` *or* `T[h1(elem)]` such that `T[h0(elem)]+T[h1(elem)]=val`, where `val` is the value we want to set.
Which one we change is determined precisely by the critical hash.

If you think about this, you will realize that the property that we want critical hashes to satisfy is stronger than what we have. 
In this process, once we process an element `elem`, the table values
will be set such that `T[h0(elem)]+T[h1(elem)]=val`. If we later change either `T[h0(elem)]` or `T[h1(elem)]`,
everything will break and so we will no longer be able to recover `val` by looking up `elem`. It is not enough to say that whichever slot we write to
will never be written to again -- we have to guarantee that all of the slots we write to or read from will be "frozen" for the rest of the algorithm.
From this, we can formalize the real "critical hash" property that we want:

**Definitions**: Suppose we process the elements in the order $$e_1, e_2, \dots e_n$$. After processing $$e_i$$, we **freeze** (this is a purely mathematical concept,
we don't necessarily freeze anything in the code) `T[h0(e_i)], T[h1(e_i)]... T[h_k(e_i)]` so that they will never be written to again.

Then, the **critical hash** $$h_c$$ of an element $$e_j$$ is one of $$h_0(e_j), h_1(e_j), \dots h_k(e_j)$$
such that at the step we are processing $$e_j$$, the table entry at $$h_c$$ is *not* frozen. Notice this is a stronger property
than what we had before; we still want $$h_c$$ to be different from all the critical hashes of elements that came before, so the
critical hash is still unique, but we more -- we actually want $$h_c$$ to be different from *all* the hashes of the elements that came before.

This seems like a pretty strong property, but one thing that makes it easier is that we can process the elements in any order we want. In
order to make this doable, we also have to increase the number of hashes that we are using from $$k=2$$ to $$k=3$$. In order to convince you
that it is actually plausible to choose critical hashes for each element despite such restrictive conditions, here is another animation (this
process succeeds about 80% of the time for us):

<div class="animation" data-anim="findMatch1">
<button class="btn btn-secondary step-btn" style="display: none;">Step</button>
<div>
<button class="btn btn-info desc-btn">Description (click to show)</button>
<div class="description">
The simulation generates three random hashes for each book and a random "value" (i.e. which database it's in) in $[0, R)$ where $R=5$.
It then tries to choose a critical hash for each book,
and only modifies the critical hash in the table so that the sum of the indices of the critical hash $\pmod R$ equals the value the book is
assigned (indicated by $v$). Once it modifies the table value at the critical hash, all of the indices in the table become "frozen," never
to be chosen as a critical hash again. By the end, you should see that you can look up the value of any book just by adding up the values in
the table corresponding to its hashes mod $R$.</div>
</div>
<div class="success">Success!</div>
<div class="failure">Error: could not assign a critical match to every book</div>
<div class="anim-with-hash-table">
<table class="hash-table">
<tr><th>i</th><th>T[i]</th><th>i</th><th>T[i]</th></tr>
</table>
<table class="main-table">
<tr><th>Book title</th><th>$h_1$</th><th>$h_2$</th><th>$h_3$</th></tr>
</table>
</div>
</div>




