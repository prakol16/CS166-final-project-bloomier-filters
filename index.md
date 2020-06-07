---
comments: true
title: Bloomier Filters (Part 1)
mathjax: true
---

## Motivation

Suppose you are a librarian, collecting 20th-century literature. Not in a physical
library of course -- you manage a database of billions of books, which has to service requests
from millions of people per second. To make things easier, you have a central
database which processes requests, and $$R$$ secondary databases which actually
store the books. When the central database receives a request for a particular
book title, it reroutes the request to whichever database that book is stored in.

The central database is the one under the most load, since it receives *every*
request. The mapping of books to database needs to run in constant time, but it
also needs to be able to reject books that aren't in any database. Ideally, it
needs to be compacted into as little memory as possible. If the title of a book
is around 30 bytes long, a naïve hash table might require 30 bytes per entry!
Surely we can do better! For example, if the books were conveniently titled $$0, 1, \dots n-1$$,
then we could easily get away with only $$\log R$$ bits per book using a simple table. Sadly,
the great authors of the 20th century did not have the foresight to title their books
in such a logical manner -- but perhaps with some clever hashing techniques, could we approach
this lower bound?

In the case $$R=1$$, (there is only one secondary database), the central
database only needs to accept or reject books, depending on whether they are in
the database. One data structure for this problem is an ordinary *Bloom filter*.
Roughly speaking, a Bloom filter uses a hash function to probabilistically
determines whether a particular item is in a set known when the filter is
created. This article won't assume knowledge of Bloom filters, but you should
definitely check them out. When $$R > 1$$, we want to encode not a set but a
map--that is, an arbitrary function.
This generalization of Bloom filters is called the *Bloomier filter*.

As setup, assume that we have some hash function $$h : \mathcal{B}\mapsto \{0,
1\}^\infty$$, where $$\mathcal{B}$$ is the set of possible book titles
($$\vert\mathcal{B}\vert = n$$ is the number of books) and
$$\{0, 1\}^\infty$$ is an infinite stream<span class="footnote">In practice, we
will need only finitely many (e.g. ~128 bits).</span> of random<span
class="footnote">In reality, they are pseudorandom.</span> bits. Each
book is in a database numbered in $$[0,R)$$. We
will keep a table $$T$$ with $$m$$ rows. Each
entry in the table is a $$q$$-bit value--for example $$q=32$$ encodes the values
in the table as standard integers. Here $$m$$ and $$q$$ are tunable parameters,
while $$n$$ and $$R$$ are fixed user specifications.

## The Birthday Paradox, and Hash Collisions

To review, why is a naïve hash table inefficient? With a hash table, we add each
book-database pair $$(B, r)$$ to the array stored at $$T[h(B)]$$, where $$T$$ is
our table with $$m$$ entries and $$h(B)$$ uses $$\log_2 m$$ bits from the hash
function $$h$$ to generate an integer in the range $$[0, m)$$.

This works very well for most applications, and is a simple, efficient approach.
However, we always end up needing a collision resolution mechanism, and this
makes the memory footprint of our table rather large. For the sake of
simplicity, suppose we are storing $$n =10$$ books into
$$R=5$$ databases with a table size of $$m=20$$. Naïvely, you might think you
only need $$m = O(n)$$ slots in the table in order to have a good chance of
avoiding collisions, but this is not true. (In our simulation, we get no
collisions only 6% of the time! Try it out!)

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

In fact, you need to have $$m = O(n^2)$$ in order to have a good chance of
avoiding collisions. This is related to the "birthday paradox," where in a group
of only around $$\sqrt{365}\approx 20$$, there is already over a $40\%$ chance
of some two people sharing a birthday. We won't prove this formally here, but
intuitively, this is because there are $$\binom{n}{2}=O(n^2)$$ pairs of books.
Therefore, if we want to avoid collisions between any two books, the chance of a
collision for a particular pair should be on the order of $$1/n^2$$, so we would
need $$m = O(n^2)$$ table entries. This takes up far too much memory.

On the other hand, if we use only $$m = O(n)$$ entries, it is very likely that
there will be many collisions. To resolve this in the standard way, we would at
the very least need to have each entry of the table be a pointer to a list,
which already requires 8 bytes per entry on a 64-bit system. Moreover, every
element of the list would have to store either the title itself (30 bytes!), or
an independent hash of its title, which is another $$\log m$$ bits, and $$\log
R$$ bits to indicate which database the book is in. In total, we might need
12-16 bytes per table entry, which is quite a long way from the $$\log R$$ bits
per entry we are trying to approach.

## Just add some choice!

Ultimately, the insight that Bloomier filters provide is that we can actually
map each element to a unique hash value -- if we provide just a little choice.
Pick $$k=2$$ hash locations for each element, and for each element, try to pick
one of its two hashes such that every element is associated with a unique hash.
This works over 90% of the time in our simulation!<span class="footnote">In fact,
the fact that this works often is what cuckoo hashing is based off of!</span>

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

Now, all we need to do is figure out how to remember which of the two hashes
each element is associated with! If we could do that, each element would have a
unique hash, so it would be quite easy to associate every element with an entry
in the table. We wouldn't need any collision resolution mechanism -- each
element has a *critical hash* $$h_c$$ to which no other element hashes (either $$h_0$$
or $$h_1$$), so we could just set $$T[h_c(\texttt{elem})] = \texttt{val}$$, where $$T$$ is the table, $$h_c$$
is the critical hash and $$\texttt{val}$$ is the value we want to associate with $$\texttt{elem}$$. We
call this hash critical because it is critical to resolving hash collisions.
Unfortunately, to be able to remember whether the first hash or the second hash
was the critical hash for each element, we would need some sort of map
structure... which was exactly what we were trying to solve in the first place.
But this is still good progress, and we will return to the idea later.

Instead, we come to the biggest insight of Bloomier filters: we don't want to
store which hash was the critical hash, so instead we will use all of the hashes
to store each element. That way, once we create the table, we can completely
forget about which hash was the critical hash for each book. For example, we
might try to make $$T[h_0(\texttt{elem})] + T[h_1(\texttt{elem})]$$ equal to $$\texttt{val}$$ modulo $$2^q$$. Then,
when we look up $$\texttt{elem}$$, we don't actually need to know which hash we chose to be
the critical hash: all we need to do is add up values in each hash location
associated to $$\texttt{elem}$$.

How do we use the critical hash? The idea is this: every time we add an element
$$\texttt{elem}$$ to the table, we will only change *either* $$T[h_0(\texttt{elem})]$$ *or* $$T[h_1(\texttt{elem})]$$
such that $$T[h_0(\texttt{elem})] + T[h_1(\texttt{elem})] = \texttt{val}$$, where $$\texttt{val}$$ is the value we want to
set. Which one we change is precisely the critical hash. Note that this is
always possible: if we are changing $$h_0$$, then we can set
$$T[h_0(\texttt{elem})] = \texttt{val} - T[h_1(\texttt{elem})]$$ modulo $$2^q$$.

If you think about this, you will realize that the property that we want
critical hashes to satisfy needs to be a little stronger. Once we process an
element $$\texttt{elem}$$, the table values will be set such that
$$T[h_0(\texttt{elem})] + T[h_1(\texttt{elem})] = \texttt{val}$$. If, while processing another element, we later
change either $$T[h_0(\texttt{elem})]$$ or $$T[h_1(\texttt{elem})]$$, everything will break and we will
no longer be able to recover $$\texttt{val}$$ by adding up what is in the hash locations of
$$\texttt{elem}$$. It is not enough to say that whichever slot we write to will never be
written to again -- we also have to guarantee that each slot we read or write to
will be "frozen" for the rest of the algorithm.

Suppose we process the elements in the order $$e_1, e_2, \dots e_n$$. After
processing $$e_i$$, we **freeze** (this is a purely theoretical concept, we don't
necessarily freeze anything in the code) $$T[h_0(e_i)],\ldots,T[h_{k-1}(e_i)]$$ so that they will never be written to again.

Then, the **critical hash** $$h_c$$ of an element $$e_j$$ is one of $$h_0(e_j),
h_1(e_j),\ldots,h_{k-1}(e_j)$$ such that when we are processing $$e_j$$, the table
entry $$T[h_c(e_i)]$$ is *not* frozen. This is a stronger property than what we had
before! The critical hash for $$e_j$$ is not just different from all the
critical hashes of previous elements. We actually want $$h_c$$ to be different
from *all* the hashes of all the elements we have already processed.

This seems like a pretty strong property, but one thing that makes it easier is
that we can process the elements in any order we want. In order to convince you
that it is actually plausible to choose critical hashes for each element despite
such restrictive conditions, here is another animation, with $$k=3$$ instead of
$$k=2$$ (this process succeeds about 80% of the time for us):

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

If we can successfully choose a critical hash for each element, then we are
almost all the way to a functional filter! This is a big if, but we'll come back
to this. For now, let's assume we can quickly choose a critical hash for each
element and see what that gets us.

We only need to change that one value in the table -- the one at the critical hash
location -- to be able to map a book to its database! Because the critical hash is
always a location that has not been seen before, changing this value does not
affect any other book. Our filter can effectively match book to database: hash
the book to its $$k$$ hash locations and return the sum of the table values in
those locations.

## Detecting Non-Books: Controlling False Positives

What happens when we query our central database for Hamlet? It is definitely not
20th-century literature, so we wouldn't want to say it is in some database only
for it to not be there. As with any book, we hash Hamlet to its $$k$$ hash
locations and... return a random database. Right now, queries for books we have
always return the correct database, but queries for non-books also always return
a database.

We need an extra layer of randomness to detect when a book is not actually in
our collection! In addition to $$k$$ hash locations, we ask that our hash
function also generate a random integer *mask value* $$M$$ in $$[0,2^q)$$ for each
book. Instead of adjusting the critical hash for a given element $$\texttt{elem}$$ so that
$$T[h_0(\texttt{elem})] + ... + T[h_{k-1}(\texttt{elem})] = \texttt{val}$$, we adjust the critical hash so that
$$M_{\texttt{elem}} + T[h_0(\texttt{elem})] + ... + T[h_{k-1}(\texttt{elem})] = \texttt{val}$$. This way, when we look up a book,
we can check if $$M_{\texttt{elem}} + T[h_0(\texttt{elem})] + ... + T[h_{k-1}(\texttt{elem})] = \texttt{val}$$ is within the range
$$[0,R)$$, because we have $$R$$ databases. If it is not, we can return a null
value to indicate that the element is not in our set. For example, even if we
have one million databases ($$R=10^6$$) and we encode the values in our table as
32-bit integers ($$q=32$$), then because the mask value $$M$$ is random,
$$M_{\texttt{elem}} + T[h_0(\texttt{elem})] + ... + T[h_{k-1}(\texttt{elem})] = \texttt{val}$$ is also random, so it will be at most one
million only with probability $$\frac{10^6}{2^{32}}\approx 0.02\%$$. In general, our
filter gives false positives with probability $$\frac{R}{2^q}$$. In particular,
if we want the false probability rate to be $$\epsilon$$, then we need $$q=\log R+\log\epsilon^{-1}$$,
so the memory footprint of the table is $$mq=m\left(\log R+\log\epsilon^{-1}\right)$$ bits.

## Moving Books Around

As we browse our collection, we might want to reorganize our books. How can we
change the database associated to a book? We can't use the same technique as we
did when building the filter, of changing the critical hash, because the
usefulness of the critical hash depended on the order in which the books were
processed. We have no guarantee that we would want to change the databases of
the books in the same order that the books were originally processed in.

We have been also assuming that our databases are numbered $$0,\ldots,R-1$$. What
if we didn't want to number the databases in order?

With a little thinking, we can solve both of these problems, and also improve
our false positive rate! Instead of thinking
of the table values as encoding the databases themselves, let them encode
indices in an auxiliary table where we actually store the database associated to a
book. In other words, the main table $$T$$ tells us which index of the auxillary
table to check to find the database that the book is stored in.
Then, if we ever want to move the book to a different database, we can just
change the value in the auxillary table. Since we still want the auxillary table
to take up relatively little space, we want to avoid needing a collision resolution
mechanism, so we'd need every book to be associated with a unique index in the auxillary table.

But this is a problem we've already solved!
Remember the critical hash? Each element has a unique critical hash, so we
can use this as an index into an auxiliary table. Before, we identified the
critical hash of an element with the *output* of the hash function---a value in
$$[0,m)$$. Because our hash function generates $$k$$ hash locations for each
element, the critical hash can actually be identified with an *index* in
$$[0,k)$$. When building the filter, for each element we can adjust the critical
hash so that $$M_{\texttt{elem}} + T[h_0(\texttt{elem})] + ... + T[h_{k-1}(\texttt{elem})] = \texttt{val}$$ is not the database of the
book modulo $$2^q$$, but the value $$c\in [0,k)$$ modulo $$k$$ such that $$h_c$$
is the critical hash! Given this $$c$$, we can use the value $$h_c(\texttt{elem})$$, which
is unique for each element, as an index into an auxiliary table.

Isn't that amazing? We just used $$k$$ hash values to encode which of the $$k$$
hash values is the critical hash, then interpreted the critical hash as an index
in a second table. In this auxiliary table, we can store whatever values we
want. To lookup/update the value associated to an element, figure out which hash is the
critical one (by adding the values in the hash locations
$$T[h_0(\texttt{elem})],\ldots,T[h_{k-1}(\texttt{elem})]$$ to the mask
$$M_{\texttt{elem}}$$ mod $$2^q$$), hash the
element with the critical hash to get an index, and lookup/update the value at
that index in the second table.

What is our new false positive rate? Before, it was $$\frac{R}{2^q}$$, because
we knew a book couldn't be in our collection if it claimed to be in, say
database 300 when we only have 100 databases. Now, we know we don't own a book
if the filter suggests that its critical hash is, say, the 100th hash when we
only generate 5 hashes. Our false positive rate is therefore $$\frac{k}{2^q}$$.
This is a big improvement, because we might have thousands or 
even millions of databases, but in general, we usually use $$k\approx 3$$. On the
other hand, aren't we using more memory with an additional table? Yes, but because our false positive rate
is better, we can afford to make $$q$$ smaller to make up for it.
If we want the false probability rate to be $$\epsilon$$, we can set $$q=\log k + \log\epsilon^{-1}$$.
Including the $$m\log R$$ bits of space for the auxillary table,
our total memory usage will be $$m\left(\log k + \log R + \log\epsilon^{-1}\right)$$.
Compared to the old value of $$m\left(\log R+\log\epsilon^{-1}\right)$$, this is only $$m\log k$$
extra bits, which is not too bad.

## Finding Critical Hashes

Time to tackle the big if: how do we choose critical hashes? As we saw in the
simulation above, this isn't always possible. Hopefully, we can find a technique
that works with high enough probability that it is viable to try again with a
new hash function whenever we fail.

What do we know about critical hashes? It is free of hash collisions: only one
element hashes to a critical hash. It is also new: when we process an element,
its critical hash must not have been seen before. If it was seen before, then
the corresponding position in the table would be frozen, and we could not edit
it without risking messing up the work we have done for previous elements.

We can process the elements in whatever order we want, so one place to start is
to find the locations that only one element hashes to. Let's call these
locations **easy hashes**, and the corresponding (single) element which hashes to it
the **easy element**. We say easy because it is easy to assign them a critical hash --
you can't go wrong by assigning the critical hash of an easy element to its easy hash.

{% include /imgs/easy_hashes.svg %}

In this example, each of 4 books is connected to $$k=2$$ hashes, which is shown as a graph.
The red elements, namely $$2$$ and $$5$$, are easy hashes, since only one element hashes to each of them,
and Invisible Man and The Great Gatsby are the corresponding easy elements. Therefore,
we should assign the critical hash of The Great Gatsby to be $$5$$ and the critical
hash of Invisible Man to be $$2$$.<span class="footnote">One caveat is that one element
might hash to multiple locations that it and it alone hashes to. In this case,
we can break ties arbitrarily e.g. by smallest hash value.</span>

Ordinarily, it is easy to find critical hashes for elements that are processed early,
since not many entries are frozen, and it is difficult near the end. However, assigning
the critical hash to an easy element is always easy, so there is no point to processing it early.
Indeed, if we processed it early, we would unnecessarily freeze some table entries that might
be useful later on, so we only stand to benefit if we process the easy elements at the very end.
Let's save these easy elements and delete them from the graph for now. If we
delete Invisible Man and The Great Gatsby from the example above, we get

{% include /imgs/easy_hashes_2.svg %}

Now we are left with a smaller set of elements, and some of the hashes that weren't easy
hashes before now are. If we can find a critical hash
for each of these, we are done, because the critical hashes of the elements that
we had found earlier were unique, so they can always be processed at the end regardless
of which table entries are frozen.
This is recursion! We can run the same process on these remaining elements: find the easy
elements and their easy hashes, push them onto a stack which keeps track of the order
that the elements will be processed in (where the top of the stack is the element that will
be processed first), delete the easy elements, and repeat.

The only problem is that this might not work -- we might hit a situation where there are no easy
hashes. In that case, we rehash and start
over. If the probability that we can successfully assign critical hashes given a
randomly chosen hash function is $$p$$, then the number of times we have to run
the algorithm before succeeding is given by a geometric distribution. The
expected number of runs of the algorithm is $$\frac{1}{p}$$. Our goal, then, is to show that
$$p$$ is at least some constant as $$n\rightarrow\infty$$, so that we only have to
run the algorithm an expected $$O(1)$$ times.

## Bipartite Graphs and Critical Hashes

Whether or not our algorithm to find critical hashes succeeds depends purely on
the hash function itself. A hash function can be represented with a *bipartite
graph*: elements on the left and hash locations on the right. Specifically, this is
a *uniform* bipartite graph, because each left vertex has the same degree--that
is, each element hashes to the same number of locations, which we have been
calling $$k$$.

At each stage, our algorithm finds the hash locations to which only one element
hashes and moves the corresponding elements to be processed later. Without
knowing the exact hash function, we cannot say what elements will remain at
which stage. One way to guarantee that the algorithm can always proceed is to
ask that each subset of elements contains one of these special elements with a
critical hash. In the graph of such a hash function, each set of vertices $$V$$
on the left has a neighbour on the right adjacent to only one vertex in $$V$$.

What types of bipartite graphs have this property? Going from left to right, the
graph should *expand quickly*, in the sense that *every* subset of left vertices has
many neighbours on the right. If this wasn't true, then some subset $$V$$ of
left vertices would have only a few neighbours on the right, in which case it
would be unlikely that one of these right vertices has just one neighbour in
$$V$$. This corresponds to there being many hash collisions among a given set of
elements. Because each left vertex has $$k$$ neighbours, a set $$V$$ of left
vertices can have at most $$k\abs{V}$$ neighbours. In general, we might quantify
how much a graph expands by a constant $$0\le \alpha{}\lt 1$$, and ask that each set $$V$$
of left vertices have more than $$\alpha{}k\abs{V}$$ neighbours on the right, a
proportion of the maximum possible governed by $$\alpha{}$$.

What $$\alpha$$ should we pick?
Suppose we have deleted some books and our algorithm is currently working on the
set of vertices $$V$$, a subset of all the left vertices. We want to find an easy
hash, which corresponds to one of the neighbors of $$V$$ having degree exactly $$1$$.
Since every element has $$k$$ hashes, there are $$k|V|$$ total edges between $$V$$ and
its neighborhood. Since there are more than $$\alpha k|V|$$ neighbors of $$V$$, the average
degree of a neighbor of $$V$$ is less than $$k|V| / (\alpha k|V|) = 1/\alpha$$. Therefore,
if we choose $$\alpha = 1/2$$, then the average degree will be less than $$2$$, so there
must be some vertex in the neighborhood of $$V$$ with degree $$1$$. Therefore,
if our graph has the expander property with $$\alpha=1/2$$, it will not get
stuck for any subset of vertices $$V$$, and hence, it will terminate successfully.

## A Counting Argument

One of the most important assumptions that our algorithm relies on is the fact that we can 
critical hashes in a reasonable amount of time. In particular, we would like to show that 
the process of finding critical hashes outlined above (in other words, its corresponding bipartite graph representation has the lossless expansion propety) succeeds with probability 
bounded below by some constant $$p$$.

The problem of finding the exact probability that a random bipartite graph has the lossless expansion probability is difficult, since there are so many different ways something could go wrong. 
However, it is much easier to purposefully overshoot the probability that such a random graph *doesn't* have our desired property. If this artificially high probability is still bounded above by some fixed number less than $$1$$, then the probability that our graph does have the desired lossless expansion probability still bounded below by some constant probability (which is even smaller than the true lower bound).

We claim that the probability that randomly created graph doesn't have the lossless expansion property is at most

$$
 \sum_{s=1}^n \binom{n}{s} \binom{m}{\lfloor ks/2 \rfloor} \left( \frac{\lfloor ks/2 \rfloor}{m} \right)^{ks}
$$

Where does this expression come from? First, note that $$s$$ iterates from $$1$$ to $$n$$, representing all possible sizes of $$\vert V\vert$$, the size of some subset of the left vertices. $$\binom{n}{s}$$ obviously counts the number of ways to choose a subset of size $$s$$ from the $$n$$ left vertices. On the other side, $$\binom{m}{\lfloor ks/2 \rfloor}$$ counts the number of ways to choose $$\lfloor ks/2 \rfloor$$ vertices from the $$m$$ vertices on the right. The reason we want to choose $$\lfloor ks/2 \rfloor$$ follows from the discussion above, since having more than $$\lfloor ks/2 \rfloor$$ neighbors on the right automatically means that this subset does not get stuck. Finally, $$\left( \frac{\lfloor ks/2 \rfloor}{m} \right)^{ks}$$ measure the probability that each of the $$ks$$ edges emanating from the $$s$$ vertices on the left does indeed fall into the $$\lfloor ks/2 \rfloor$$ sized subset of neighbors on the right.

Note that the summation above does indeed overshoot the probability, since a single unsuccessful graph may fail in multiple ways. For example, two distinct subsets of the left vertices of $$s$$ may both have less than $$\lfloor ks/2 \rfloor$$ neighbors. Although this is just one failed graph, it is counted at least twice in our summation.

In order to simplify our expression a little bit, we will use a couple of algebraic manipulations as well as Stirlings formula, which tells us that $$n! \approx \sqrt{2\pi n} \left(\frac{n}{e}\right)^n$$, which means $$n! < \left(\frac{n}{e}\right)^n$$.







## Tuning Our Filter

Say we want a false positive rate of at most $$0\lt\epsilon{}\lt1$$. That is, books not in our
collection are assigned a database with probability $$\epsilon{}$$. Our false positive
rate was $$\frac{k}{2^q}$$, so it is enough to choose $$q = \left\lceil\log_2
\frac{k}{\epsilon{}}\right\rceil = O(\log \epsilon^{-1})$$.

TODO: Write out the binomial coefficients showing that the expected number of
vertices that can be removed at each stage of the critical hash algorithm
(because they hash to a unique location) is proportional to the number of
remaining vertices, so that the creation time is expected $$O(n\log n)$$.

## (Optional) Tips and tricks to improve the runtime in practice

A naive implementation of the algorithm to build the Bloomier filter table might look like this (in pseudocode):

1. Initialize $$\texttt{hashTable}$$, a table of size $$m$$ which maps hashes to the list of elements that hash to them.
   This is essentially the naive hash table (except it stores $$k$$ copies of every element, since each element has $$k$$ hashes),
   so it will obviously take up a lot of memory, but we are only using it during construction. This initialization can be done in $$O(n)$$.
2. Create a stack $$\texttt{processStack}$$ which stores each element and its critical hash in the order that we should process them,
   with the top of the stack being the element that should be processed first.
3. While $$\texttt{processStack}$$ has length less than $$n$$:
  * Loop through $$\texttt{hashTable}$$, find the easy hashes, and put the corresponding easy elements into the list $$\texttt{easy}$$.
  * For each element in $$\texttt{easy}$$, compute its $$k$$ hashes and remove the element each of those $$k$$ locations in $$\texttt{hashTable}$$.
  * Since we should process the easy elements before all the other remaining elements (but after all the previous easy elements), add everything in $$\texttt{easy}$$ to $$\texttt{processStack}$$,
    along with each element's corresponding critical hash.
  * If $$\texttt{easy}$$ was empty, then we couldn't find any easy elements, so restart from the beginning with new hash functions. Otherwise, proceed as normal.
4. At the end, build the Bloomier filter. Pop elements from $$\texttt{processStack}$$ one at a time, and for each element $$e$$ and its critical hash $$h_c$$,
   set $$T[h_c(e)] \equiv \texttt{val} - \left(\sum_{i\neq c} T[h_i(e)] + M_e\right) \pmod{2^q}$$, where $$M_e$$ is the random mask (another hash of $$e$$)
   and $$\texttt{val}$$ is the value we want to associate with $$e$$.

This is very bad because it loops through $$\texttt{hashTable}$$ on every iteration, so an obvious speedup is to only examine the $$k$$ locations in $$\texttt{hashTable}$$ that
have actually changed in size for each easy element. In particular, let's make a new queue called $$\texttt{easyQeueue}$$ which stores all of the easy elements. Then,

1. Initialize $$\texttt{hashTable}$$ and $$\texttt{processStack}$$ as before, as well as a queue $$\texttt{easyQueue}$$.
2. Loop through $$\texttt{hashTable}$$ once, find all the easy hashes, and add the corresponding elements and hashes to $$\texttt{easyQueue}$$.
3. While $$\texttt{easyQueue}$$ is non-empty:
    * Dequeue an element from $$\texttt{easyQueue}$$ -- call it $$\texttt{easyElem}$$.
    * For each hash function $$h_i$$ in $$h_0, h_1, \dots h_{k-1}$$:
      - Remove $$\texttt{easyElem}$$ from $$\texttt{hashTable}[h_i(\texttt{easyElem})]$$.
      - If $$\texttt{hashTable}[h_i(\texttt{easyElem})]$$ now has size $$1$$, we have created a new easy element by removing
        $$\texttt{easyElem}$$! Add the sole item in $$\texttt{hashTable}[h_i(\texttt{easyElem})]$$ to $$\texttt{easyQueue}$$.
    * Add $$\texttt{easyElem}$$ and its critical hash to $$\texttt{processQueue}$$.
4. At the end, check if $$\texttt{processStack}$$ has length $$n$$. If it does, we succeeded; otherwise, create new hash functions and try again.

This is obviously a much better algorithm, since for each element, we are only doing a constant amount of work in checking which new elements can be added to $$\texttt{easyQueue}$$,
rather than looping through the entire hash table on every iteration.

There are still some improvements to be made, however! First, notice that addition and subtraction mod $$2^q$$, despite being constant time,
is not the only possible operation. In fact, any invertible commutative operation will do here, and in practice,
people almost always use xor instead of addition/subtraction mod $$2^q$$, perhaps to avoid undefined behavior with signed overflow.
Ultimately, there aren't many changes that have to be made.

Finally, here is a really cool insight that improves the memory usage and runtime of the construction algorithm. Notice that we
are doing a lot of list operations on the lists that are contained in $$\texttt{hashTable}$$. In particular, we are removing items,
and not necessarily from the end of the list, so this can be somewhat expensive. Moreover, each list has to maintain its size and keep
a copy of the title of every book in the list, which takes several bytes. This is only during the construction, so we don't care about
its memory usage quite as much as the filter itself, but improvements here are still useful. First, an easy improvement is that we
don't actually have to store entire book titles; we only need to store the each book's $$k$$ hashes, mask, and associated value, since this
is all the information that we really care about for each book. Now comes the cool part. Notice that we are only ever retrieving an item
from the list when the list has size $$1$$. Therefore, instead of actually storing every book's information, let's just store the size of the list along with:
the sum (mod $$m$$) of all the books' $$h_0$$ hashes, the sum of all the books' $$h_1$$ hashes, etc., as well as the sum of all the books' mask values, and the sum
of each book's associated database. This "list" has a fixed size since we are only storing the sums of its elements, so it take a constant amount of memory;
moreover, we no longer even have to store pointers to the lists in $$\texttt{hashTable}$$, since the size of the lists are known at compile-time,
instantly saving another $$8m$$ bytes on a 64-bit machine. Even better, we can easily delete items from this "list"; to remove an element $$\texttt{elem}$$,
simply subtract $$h_0(\texttt{elem})$$ from the list's total $$h_0$$, subtract $$h_1(\texttt{elem})$$ from the list's total $$h_1$$ etc. (For consistency,
I've continued using addition and subtraction, but again, in practice this would be xor and xor). This takes $$O(1)$$ time. The only time we retrieve an
element is when the size of the list is $$1$$. In this case, we can easily retrieve all of the book's information because the sums are precisely
the information we want. Thus, we have created "lists" that we can use in the hash table which use $$O(1)$$ memory and support $$O(1)$$ deletion and singleton retrieval.

As a last consideration, in order to truly minimize our memory usage, we have to minimize $$m$$, the table size. What is the smallest table size can we choose
while still allowing the construction to succeed in a reasonable time? While we proved that $$m=2n$$ is enough (and this is good enough for the asymptotic bound),
a closer theoretical analysis or emperical observations will show that $$m=1.23n$$ is about the minimum you can get away with. Thus, with a false positive rate of $$\epsilon$$,
we need $$1.23\left(\log R + \log\epsilon^{-1}\right)$$ bits per element for an immutable filter. Compare this to our wish of $$\log R$$ bits per element when we were
wishing that all the books were simply titled $$0, 1, \dots n-1$$, and I'd say we came surprisingly close! In fact, a theoretical lower bound is that we need at least
$$\log R + \log\epsilon^{-1}$$ bits per element. We won't do a formal proof here, but roughly, $$\log R$$ comes from the fact that we need to store the database
index of each book, and since there are $$R$$ databases, this requires $$\log R$$ bits, and the $$\log\epsilon^{-1}$$ comes from the same place as the well-known
bound that at least $$\log\epsilon^{-1}$$ bits are required even for an ordinary bloom filter to answer set membership queries with a false probability rate of $$\epsilon$$.
Therefore, we have only a 23% "overhead" compared to the theoretical optimal.

But can we actually do better, by reducing this 23% overhead to
something even smaller? As Keith says so often, if the answer was no, we probably wouldn't be asking, so continue over to [part 2](part2) to see how low
we can actually get this overhead down to.

<script type="text/javascript" src="{{ '/assets/js/interactive.js' | relative_url }}"></script>
