---
comments: true
title: Bloomier Filters (Part 2)
mathjax: true
---

# Hypergraphs

So far, we've been visualizing our hash functions and elements as a bipartite graph, with
$$n$$ books on the left and $$m$$ hashes on the right. This is fine, but to bring us more
in line with the terminology of <a href="https://arxiv.org/pdf/1907.04749.pdf">this paper</a>
by Dietzfelbinger et al., we will transition to the terminology of "hypergraphs." A hypergraph
is simply a generalization of a graph where edges can connect more than two vertices. In other words,
rather than thinking of edges as lines between vertices, think of them as blobs that can include
many vertices. For example, if our bipartite graph looks like this (with each book having $$k=3$$ hashes):

{% include /imgs/bipartite.svg %}

Then the corresponding hypergraph might look like this:

{% include /imgs/hypergraph.svg %}

Notice that every edge contains the same number of vertices, so this is a $$k$$-uniform hypergraph.
We will mostly only examine $$k=3$$ since this is the value most used in practice. Notice also that
since the hashes became vertices and the books became edges there are (unfortunately) $$n$$ edges
and $$m$$ vertices, which is the opposite of the usual convention. We will be sticking to using $$n$$
edges and $$m$$ vertices for consistency with the explanatory article, so don't get confused!

We will also introduce some new terminology: the process of "peeling" a hypergraph involves selecting a
vertex of degree $$1$$ and deleting its vertex and corresponding edge. In the example above, the red
vertices are the vertices of degree $$1$$, so we might, for example, remove the vertex $$0$$ and its
associated edge (The Jungle). A hypergraph is said to be peelable if it can be peeled away -- in other words,
if we keep peeling, we eventually delete all the edges.

It should be pretty clear that this peeling process is exactly what we do when we create a Bloomier filter.
The vertices of degree 1 correspond to easy hashes, and if a hypergraph is peelable, then the Bloomier filter
construction will succeed. Therefore, we want to construct the hypergraph in such a way that it is likely
to be peelable.

During the process of coming up with critical hashes, we came up with a property of critical hashes that was
weaker than what we actually wanted -- namely, every element should have a unique critical hash. The analogue
in hypergraphs is called *orientability*. A hypergraph is said to be *orientable* if every edge can be assigned
a single vertex in the edge such that no two edges are assigned to the same vertex. Such an assignment is called an
*orientation*. Just as the property that every book's critical hash is unique is necessary but not sufficient
for the Bloomier filter construction to succeed, orientability is necessary but not sufficient for peelability.

A few more terms: the ratio $$n/m$$ (the number of edges to vertices, or the ratio of the number of
books to the table size) is at most $$1$$ in any orientable hypergraph, and is called the *edge density*.
The reverse ratio, $$m/n$$, we'll call the *overhead* because it is the ratio of the table size to the number
of books we are actually storing. A concise statement of our goal is to find a construction of a hypergraph
that minimizes the overhead while maintaining a high probability of being peelable.




