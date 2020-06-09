---
comments: true
title: Bloomier Filters (Part 2)
mathjax: true
---
[<i class="arrow arrow-left"></i>Part 1](../)

## Hypergraphs

So far, we've been visualizing our hash functions and elements as a bipartite graph, with
$$n$$ books on the left and $$m$$ hashes on the right. This is fine, but to bring us more
in line with the terminology of [this paper](https://arxiv.org/pdf/1907.04749.pdf) ("Dense Peelable Random Uniform Hypergraphs")
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

## A 0-1 Law for Random Graphs

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
quantity's reciprocal (the edge density threshold) $$c_3\approx 0.818$$. Similarly, we define the orientability threshold $$c_3^{*-1}\approx 1.09$$
of a random hypergraph, which is the minimum overhead we need to ensure orientability for large $$n$$. Since peelability is a stronger condition than orientability,
we clearly have $$c_3^{-1} \geq c_3^{*-1}$$. But maybe, if we could construct our graphs in a cleverer way, might we reduce our peelability threshold?
Could we go so far as to have a peelability threshold equal to the orientability threshold?

## Fuse graphs and Band graphs

The construction of a "fuse graph" is introduced in the paper by Dietzfelbinger et al.
To construct a fuse graph, divide your hash space (the vertices) into $$\ell$$ "segments." Rather than assigning vertices to edges at random (based on the hash value), you pick one of the first $$\ell - 2$$ (or more generally $$\ell - k + 1$$) segments. Then, you pick one vertex randomly from each of the 3 consecutive segments starting at that slot. That's all you have to do -- it's actually a very easy and minor modification from the original algorithm.

Why is it better? Consider the vertices in the first segment. These vertices have a pretty small chance of being picked -- smaller than all vertices in other segments at least -- because there is only 1 consecutive block of 3 segments containing the first segment. Vertices in middle segments have an expected degree of about $$kn/m$$, but vertices at the ends only have an expected degree of $$n/m$$,
which is less than $$1$$. Therefore, it's likely that most of the vertices in the first segment of non-zero degree have degree 1, so they end up getting peeled away. The same goes for vertices on the other end.

But then, the second segment is now the one on the edge! So now that all or most of the vertices in segment 1 are deleted, it is likely that many of the vertices in segment 2 have degree 1. Therefore, most of the vertices in segment 2 get peeled away.

This process continues, and essentially, we have the graph peeling away like a firecracker, as though there were sparks lit at the end burning through the graph (this is where "fuse" comes from).

In practice, we've typically seen $$\ell$$ fixed to an arbitrary constant, such as $$\ell=100$$. We will explore how the optimal value of $$\ell$$ changes as $$n$$ changes.

In the same paper by Dietzfelbinger et al., they propose an alternative construction in the "Future Work" section, which they don't explore but we will explore here.
We'll call this a limited bandwidth graph, or a band graph for short. Instead of dividing up the vertices into segments, we let $$d=n/b$$ (where $$b$$, the "band size," is a tuneable parameter), and choose a random consecutive block of $$d$$ vertices. Then, each edge gets assigned to a random $$k$$-subset of those $$d$$ vertices. These graphs are highly peelable for essentially the same reason -- they burn from the edges. The first few vertices of nonzero degree are very likely to have degree exactly $$1$$, because all of the first $$d$$ vertices have a lower than usual chance of being picked. Thus, those vertices get mostly peeled away. But then, the vertices from $d$ to $2d$ are now the new vertices at the beginning, so, given that the first $d$ vertices were deleted along with their edges, it is likely that the vertices between $$d$$ and $$2d$$ have low degree, so they get peeled off. This continues until the entire graph burns through from the outside in.

Just as we have the peelability threshold for ordinary random hypergraphs $$c_3^{-1}$$, we can also define the constants $$f_{3}^{-1}$$,
the peelability threshold for fuse graphs, and $$h_{3}^{-1}$$, the peelability threshold for band graphs. First, it is not actually clear that these definitions make sense. The constructions
of fuse graphs and band graphs require additional parameters $$\ell$$ and $$b$$, so shouldn't we define them as $$f_{3,\ell}^{-1}$$? Actually, it turns out that if we define $$f_3^{-1}$$ to
be the threshold as $$\ell\rightarrow\infty$$, then the threshold for any finite $$\ell$$ is simply $$f_3^{-1}\cdot\frac{\ell+2}{\ell}$$ (or more generally the ratio is $$(\ell+k-1)/\ell$$.
This is proven in the paper, and is essentially an artifact of the finiteness of our segments. Similarly, we can define $$h_3^{-1}$$ to be the
limiting threshold as $$b\rightarrow\infty$$, so that for finite $$b$$, we have $$h_{3,b}^{-1}=h_3^{-1}\cdot\frac{b+1}{b}$$.

It seems intuitive that $$f_{3}^{-1} \geq c_{3}^{*-1}$$ and similarly for $$h_3^{-1}$$. In other words, it is reasonable that the orientability overhead thresholds for basic random hypergraphs
are still lower bounds for the peelability of these new hypergraphs. Remember, there is no way we can peel the graph if we can't even find an orientation! Here is a proof sketch: first, notice that if we glue the ends of the vertices together so that the last $$k$$ segments and the first $$k$$ segments are considered the same, then the distribution of edges among vertices looks essentially the same as that of a completely random hypergraph. In particular, since we lose the whole benefit of being able to burn from the edges first, every vertex has the same expected degree. To make this rigorous, we would need the notion of the random weak limit of a hypergraph, which is beyond our scope here. Therefore, if we have an edge density above $$c_k^*$$
and glue the ends of the graph together, with probability $1$ in the limit, we are not orientable. Actually, there is an even stronger claim -- the number of vertices we can't find orientations for is linear in $$n$$. It is at least $$\epsilon n$$ for some small $$\epsilon > 0$$ depending on how close we are to the orientability threshold. Therefore, even when we unglue those vertices, if our segment lengths are small enough compared to $$n$$ (i.e. for large enough $$\ell$$), we can only add at most the ends to the orientable vertices, which is not enough to make the whole thing orientable. Therefore, $$f_k \leq c_k^*$$ (this proof is essentially a summary of the one found in the paper by Dietzfelbinger et al.). Essentially, the same trick of glueing the ends works for band graphs as well.
Furthermore, we might even conjecture that *any* family of $$k$$-uniform hypergraphs where every edge is selected independently and with the same distribution over the vertices
has an orientability threshold of at most $$c_k^{-1*}$$.

If you look in the table in the Fuse graphs paper, however, you'll notice that $$f_k$$
is actually really close to the theoretical upper bound -- only $$c_k^* - 10^{-5}$$.
They conjecture that with the alternative construction, you actually get $$h_k=c_k^*$$. In other words, in the alternative construction, 
the conjecture is that a limited bandwidth hypergraph is peelable with the same probability that it is orientable (for large enough $$n$$).

## Examining the convergence rate

The paper does a good job of presenting the theoretical results of fuse graphs as $$n\rightarrow\infty$$, but we want to investigate the case where
$$n$$ is finite and not necessarily sufficiently large. First we should look at how fast the convergence is so we have a numerical estimate on how large is "sufficiently large,"
and where we need to focus on. For this, we need some new definitions. We can consider the surfaces where the probability of peelability is exactly $$1/2$$. In particular,
define the surface $$S_R = (n, m/n)$$ which has all the collection of points $$(n, m/n)$$ such that the probability of a random hypergraph of $$n$$ edges and overhead $$m/n$$ is exactly $$1/2$$. In
other words, we are looking at the parameters at which the hypergraphs are right in the middle of "transitioning" for low-peelability to high-peelability.
Define $$S_\ell = (n, \ell, m/n)$$ and $$S_b = (n, b, m/n)$$ 
similarly for the segmented hypergraph and band hypergraph respectively. Since $$S_\ell$$ and $$S_b$$ are 2-dimensional surfaces embedded in a 3d space, they are harder to plot, so we will be plotting slices and contours of these surfaces.

Here is a plot of $$m/n$$ against $$n$$ for the random hypergraph:

<div id="mn-vs-n-basic-convergence-graph">
</div>

(How do we find the precise $$m/n$$ that gives a probability of peelability of $$1/2$$? We will discuss that below in the [Methods](#methods) section). This shows rapid convergence,
and by $$n > 10000$$, we are already at an overhead of only $$1.224$$. On the other hand, the other two kinds of hypergraphs converge more slowly:

<div id="mn-vs-n-segmented-convergence-graph">
</div>

<div id="mn-vs-n-band-convergence-graph">
</div>

The adjusted graphs have the overheads multiplied by $$\ell/(\ell+2)$$ and $$b/(b+1)$$ respectively, so that all the graphs are converging to the same value.
A reasonable value of $$\ell$$ or $$b$$ is one that works even for large $$n$$ e.g. $$\ell=100$$, or $$b=25$$. The graphs show that even at $$n=10^4$$,
they aren't that close yet to converging. Moreover, for $$n \lt 10^4$$, because of the "finiteness" artifacts (i.e. the thresholds are multiplied by $$1+2/\ell$$
or $$1+1/b$$), no value of $$\ell$$ or $$b$$ gives better results than the ordinary random construction.

If you play with the numbers and examine these graphs for long enough, you might eventually see a pattern for the convergence rate. It seems like if we let $$D=m/n-f_k(1+2/\ell)$$
or $$D=m/n-h_k(1+1/b)$$ be the distance from convergence, then $$D=\Theta\left(n^{-1/2}\right)$$. To give numerical evidence for our claim, here is the same two graphs but the distance from
convergence plotted against $$n$$ in a log-log plot. For reference, a line of slope $$-1/2$$ is given to compare.

<div id="mn-vs-n-segmented-convergence-graph-transformed">
</div>


<div id="mn-vs-n-band-convergence-graph-transformed">
</div>

The small $$b$$ and $$\ell$$ values don't seem to exhibit the same shape, so perhaps the convergence rate is $$\Theta\left(n^{-1/2}\right)$$ for $$b \gg k$$ and $$\ell \gg k$$.


## Methods

So far, we have been using graphs that, given $$n$$, show the value of $$m/n$$ that marks the boundary where the probability that a hypergraph with those
parameters is peelable is exactly $$1/2$$. How did we arrive at those numbers? What are the error bounds? We will answer those questions in this section.

We used a Markov decision process to find the value $$m/n$$. More generally, consider a general process where we estimate the probabiliy of some event whose probability is given
by $$P(x)$$ where $$x$$ is some parameter we can vary. (In our case, $$x=m/n$$). We want to find the $$x$$ such that $$P(x)=1/2$$, and we know $$P(x)$$ is a monotonically
increasing function of $$x$$ (as $$m$$ increases, the probability of success must go up). We estimate the parameter as follows:
pick a starting point $$x$$ and a step value $$\Delta x$$. Run the process; if it succeeds, decrement
$$x$$ by $$\Delta x$$. Otherwise, increment $$x$$ by $$\Delta x$$. We would like to analyze this process, and get an estimate of the variance of $$x$$.

Without loss of generality, let us transform the problem to the origin for convenience, so that the true value where $$P(x)=0.5$$ is at $$x=0$$.
We don't actually know anything about the function $$P(x)$$, but we will make the strong simplifying assumption that it is a linear step function.
In particular, let $$C = dP/dx$$ be the derivative of $$P$$ at $$x=0$$, and assume $$P = Cx+1/2$$ (clamped at $$0$$ or $$1$$). A higher derivative is better
for us (e.g. taking the limiting case where $$C\rightarrow\infty$$; then the final $$x$$ will always be within $$\Delta x$$ of the correct answer),
and conversely, by making the derivative smaller than it actually is (e.g. the average slope between the parameters which result in $$P(x)\approx 0$$ and $$P(x)\approx 1$$),
we actually get a lower bound for the variance.

We reinterpret the Markov process as follows: imagine two boxes containing a total of $$N = 1/(C\Delta x)$$ tokens. If there are $$n$$ tokens in the left box, we will
interpret that as being at the parameter $$x = (n - N/2)\Delta x$$. An iteration of the process corresponds to picking a random token and moving it to the opposite box.
If there are $$n$$ tokens in the left box, the probability that we move down by $$\Delta x$$ should be $$P(x) = Cx+1/2$$. Indeed, the probability is the probability that
we pick a token from the left box, which occurs with probability

$$\frac{n}{N} = C\Delta x n = C\Delta x n - \frac{C\Delta x N}{2} + \frac{C\Delta x N}{2} = Cx + \frac{1}{2} = P(x) $$

It is clear, however, that in the limit, if we treat the tokens as distinct, every token has an equal chance of being in either box by symmetry.
This is the invariant distribution. Therefore, the ultimate distribution of the number of tokens in the left box is $$n\sim\text{Binom}(N, 1/2)$$. Since this has
expectation $$N/2$$, and since $$x = (n - N/2)\Delta x$$, we have $$\mathbb{E}(x) = (N/2 - N/2)\Delta x = 0$$, so our estimator is unbiased. Moreover, $$\text{Var}[n] = N/4$$. Therefore,
we have $$\text{Var}[x] = \Var[n\Delta x] = N\Delta x^2/4 = \Delta x / (4C)$$. Thus, the standard deviation is $$\sqrt{\Delta x/(4C)}$$.

In our simulations, we used $$1000$$ iterations, and a step rate that was annealed exponentially based on how close to half of the last $$32$$ simulations were a success.
Ultimately, an estimate for the average step rate near $$1/2$$ is $$1.3\times 10^{-5}$$, although it would be as high as $$0.01$$ at the beginning of the simulation.
Moreover, $$C$$ can be conservatively bounded below at $$50$$ for $$n\geq 10^4$$, based on the convergence graphs at the beginning (the probability went from $$0$$
to $$1$$ within a change of $$0.02$$ of the parameter $$m/n$$). Therefore, this results in a standard deviation for our estimates of $$2.5\times 10^{-4}$$. In practice,
the estimates might be better since $$C$$ is larger than estimated for many of our simulations, especially when $$n$$ is large.

## Optimizing $$\ell$$ and $$b$$

How should we optimize $$\ell$$ or $$b$$ given $$n$$? We can plot $$m/n$$ against $$\ell$$ and $$b$$ for various fixed values of $$n$$:

<div id="mn-vs-l-fixed-n">
</div>

<div id="mn-vs-b-fixed-n">
</div>

As you can see, for any $$n$$ there is a value of $$\ell$$ or $$b$$ which minimizes the overhead. However, as $$n$$ grows larger, getting the precise optimum
seems to matter less and less. On the other hand, as $$n$$ gets very large, the probability of success as a function of $$m/n$$ becomes more and more step-like,
so even a small change in the minimum overhead can dramatically shift the process from working to not working. The overall shape of the graph makes sense.
For a fixed $$n$$, as $$\ell\rightarrow k$$, the process converges to simply making an ordinary random hypergraph the usual way, which requires a high overhead. 
On the other hand, as $$\ell\rightarrow n$$, the required table size approaches $$O(n^2)$$, because the segment size approaches $$1$$, so every element has
to pick a different starting segment in order to avoid collisions, and we need to defeat the birthday paradox. Thus, as $$\ell\rightarrow n$$, $$m/n\rightarrow n$$
as well, which is large. Hence, somewhere in between the overhead changes from decreasing to increasing, creating a minimum. Similarly, for the band graph,
the limiting case $$b=1$$ is the case of the ordinary random hypergraph and the case $$b=n/k$$ is the case where birthday collisions are inevitable when $$m=O(n)$$.
Thus, for the band graphs as well, there is an optimal $$b$$ for each $$n$$ between $$1$$ and $$n/k$$.

We can define functions $$\ell_{\text{optim}}(n)$$ as the value of $$\ell$$ that minimizes the necessary overhead to achieve a probability of peelability of $$1/2$$
for a given $$n$$. Similarly, define $$b_\text{optim}(n)$$ as the optimal $$b$$ as a function of $$n$$. We can plot $$b_\text{optim}$$ and $$\ell_\text{optim}$$ as functions
of $$n$$, and the corresponding overheads at the optimal values.

<div id="l-optim-vs-n">
</div>

<div id="b-optim-vs-n">
</div>

These optimal values look like they have the shape $$\ell = \Theta\left(\log(n)^2\right)$$ and $$b = \Theta\left(\log(n)^2\right)$$. If we do a quadratic regression
on the data with $$\ell\sim a\log(n)^2 + b\log(n) + c$$, we get the coefficients $$a=2.54433$$, $$b=-32.5$$, and $$c=124.13$$. The same fit for $$b$$ gives $$a=1.64468$$,
$$b=-25.46$$, and $$c=110.427$$. Here are the plots with the potential curve fit:

<div id="l-optim-fit"></div>
<div id="b-optim-fit"></div>

Similarly, one can find approximations for the necessary overhead assuming the optimal parameter value. For example, the overhead for the segmented hypergraph is approximately
$$f_3 + 1.5n^{-0.277}$$, and the overhead for the band hypergraph is approximately $$h_k + 2.1n^{-0.285}$$ (Recall that $$f_k\approx h_k\approx 1.0894$$ are close
to the orientability thresholds of random hypergraphs).
Obviously, these are just numerical approximations,
though they match the data quite accurately. If we extrapolate these functions, then in practice, the segmented graph is better than the band graph until $$n=10^{18}$$,
so essentially for any reasonable data.

## Conclusion

## Sources

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script type="text/javascript" src="{{ '/assets/js/graphs.js' | relative_url }}" async></script>





