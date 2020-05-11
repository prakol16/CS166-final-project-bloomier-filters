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
of a book is around 30 bytes long, a naïve hash table would have to store every title
in order to resolve potential collisions, for a total of $$30\text{ bytes}\times 10^{10}\text{ books}=30\text{ GB}$$.
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
titles and $$\{0, 1\}^\infty$$ is an infinite stream of random bits. Even though $$h$$ actually
only generates finitely many pseudorandom bits, we will act as if we can consume as many bits
as we need (in practice, we will usually only need at most 128 bits),
and we will act as though these bits were truly random rather than pseudorandom.
With a hash table, we create a table of size $$m$$ (here, $$m$$ is
some tuneable parameter), and add each book-database pair $$(B, r)$$ to the list stored at `table[hash(B)]`,
where `hash(B)` consumes $$\log_2 m$$ bits from the hash function $$h$$ to generate an
integer in the range $$[0, m)$$.

This works very well for most applications, and is a simple, efficient approach. However, we always end up needing
a collision resolution mechanism, and this makes the memory footprint of our table rather large.
For the sake of simplicity, suppose we are storing $$\vert \mathcal{B}\vert=10$$ books
into $$R=5$$ databases with a table size of $$m=20$$. Naïvely, you might think you only need $$m = O(n)$$ slots in the table
in order to have a good chance of avoiding collisions, but this is not true.

<center>TODO: add animation here</center>

$$ \sum_{i=0}^\infty 2^{-i} = 2 $$

That was an example of display style math.

