---
comments: true
title: Bloomier Filters (Part 2)
mathjax: true
---

# Hypergraphs

So far, we've been visualizing our hash functions and elements as a bipartite graph, with
$$n$$ books on the left and $$m$$ hashes on the right. This is fine, but to bring us more
in line with the terminology of [this paper](https://arxiv.org/pdf/1907.04749.pdf)
by Dietzfelbinger et al. (which forms most of the basis of this part),
we will transition to the terminology of "hypergraphs." A hypergraph
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

A couple more terms: the ratio $$n/m$$ (the number of edges to vertices, or the ratio of the number of
books to the table size) is at most $$1$$ in any orientable hypergraph, and is called the *edge density*.
The reverse ratio, $$m/n$$, we'll call the *overhead* because it is the ratio of the table size to the number
of books we are actually storing. A concise statement of our goal is to find a construction of a hypergraph
that minimizes the overhead while maintaining a high probability of being peelable.

# A 0-1 Law for Random Graphs

In 1963, Erdős and Rényi published a famous result that essentially showed that there was only one random graph.
More specifically, if we create a random graph with countably infinitely many vertices
such that any two vertices have a fixed, independent chance $$0 \lt p \lt 1$$ of being connected by an edge, then
almost surely the graph is isomorphic to the [Rado graph](https://en.wikipedia.org/wiki/Rado_graph). This is very
surprising, but one implication is that if we have some property that can be true or false of a graph, then a sufficiently
large random graph satisfies that property with probability arbitrarily close to $$1$$ or arbitrarily close to $$0$$
(essentially, depending on whether the Rado graph satisfies the property or not).

A similar 0-1 law applies for random hypergraphs of fixed edge density.
For example, consider a "basic" random $$k$$-uniform hypergraph,
where each edge consists of $$k$$ uniformly and independently selected distinct random vertices.
We can plot the probability that the graph is peelable against the overhead $$m/n$$ for various $$n$$. 

<div id="p-vs-mn-basic-graph">
</div>

(For each $$n$$, 100 trials were run to determine the approximate, empirical probability of success). As you can see, as $$n$$ increases,
the probability graph looks more and more like a step function. The threshold which marks this boundary is $$m/n\approx 1.222$$.
When $$m/n \gt 1.222$$, then a large enough hypergraph is almost surely peelable, while if $$m/n \lt 1.222$$ then it almost surely isn't.
Therefore, interpreting this result in the context of Bloomier filters, if the table size is at least 23% larger than $$n$$, then it is very likely
that the construction procedure will eventually succeed, especially for large $$n$$.

This 0-1 law suggests some new definitions. We define the peelability threshold $$c_3^{-1}\approx 1.222$$ for $$k=3$$ to be the overhead threshold at which a large ordinary
random hypergraph switches from being unpeelable to peelable. The inverse is there to be consistent with Dietzfelbinger et al., who use this
quantity's reciprocal (the edge density threshold) $$c_3\approx 0.818$$. Similarly, we define the orientability threshold $c_3^{*-1}\approx 1.09$
of a random hypergraph, which is the minimum overhead we need to ensure orientability for large $$n$$. Since peelability is a stronger condition than orientability,
we clearly have $$c_3^{-1} \geq c_3^{*-1}$. But maybe, if we could construct our graphs in a cleverer way, might we reduce our peelability threshold?
Could we go so far as to have a peelability threshold equal to the orientability threshold?

# Fuse graphs and Band graphs

The construction of a "fuse graph" is introduced in the paper by Dietzfelbinger et al.
To construct a fuse graph, divide your hash space (the vertices) into $$\ell$$ "segments." Rather than assigning vertices to edges at random (based on the hash value), you pick one of the first $$\ell - 2$$ (or more generally $$\ell - k + 1$$) segments. Then, you pick one vertex randomly from each of the 3 consecutive segments starting at that slot. That's all you have to do -- it's actually a very easy and minor modification from the original algorithm.

Why is it better? Consider the vertices in the first segment. These vertices have a pretty small chance of being picked -- smaller than all vertices in other segments at least -- because there is only 1 consecutive block of 3 segments containing the first segment. Vertices in middle segments have an expected degree of about $$kn/m$$, but vertices at the ends only have an expected degree of $$n/m$$,
which is less than $$1$$. Therefore, it's likely that most of the vertices in the first segment of non-zero degree have degree 1, so they end up getting peeled away. The same goes for vertices on the other end.

But then, the second segment is now the one on the edge! So now that all or most of the vertices in segment 1 are deleted, it is likely that many of the vertices in segment 2 have degree 1. Therefore, most of the vertices in segment 2 get peeled away.

This process continues, and essentially, we have the graph peeling away like a firecracker, as though there were sparks lit at the end burning through the graph (this is where "fuse" comes from).

In practice, we've typically seen $$\ell$$ fixed to an arbitrary constant, such as $$\ell=100$$. We will explore how the optimal value of $$\ell$$ changes as $$n$$ changes.

In the same paper by Dietzfelbinger et al., they propose an alternative construction in the "Future Work" section, which they don't explore but we will explore here.
We'll call this a limited bandwidth graph, or a band graph for short. Instead of dividing up the vertices into segments, we pick a value $d=n\epsilon$ and choose a random consecutive block of $d$ vertices. Then, each edge gets assigned to a random $k$-subset of those $d$ vertices. These graphs are highly peelable for essentially the same reason -- they burn from the edges. The first few vertices of nonzero degree are very likely to have degree exactly $1$, because all of the first $d$ vertices have a lower than usual chance of being picked. Thus, those vertices get mostly peeled away. But then, the vertices from $d$ to $2d$ are now the new vertices at the beginning, so, given that the first $d$ vertices were deleted along with their edges, it is likely that the vertices between $d$ and $2d$ have low degree, so they get peeled off. This continues until the entire graph burns through from the outside in.

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script type="text/javascript" src="{{ '/assets/js/graphs.js' | relative_url }}"></script>





