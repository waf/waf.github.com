Analyzing Code Quality with LINQ and NDepend
############################################

:date: 2021-08-30
:tags: csharp, analysis, linq, ndepend
:commentid: 5

I've been building an open-source personal project (`C# REPL <https://github.com/waf/CSharpRepl>`_) and spending a good chunk of time on code quality. I self-impose a zero-warning policy, use nullable reference types, track unit test coverage, etc.

After ensuring all the Visual Studio / Roslyn code analyzer warnings were fixed, I thought I'd try out NDepend to get a second opinion, and also understand its capabilities. After downloading `a free trial of NDepend <https://www.ndepend.com/download>`_ and spending some time with it, I was pretty impressed with its technical underpinnings as they're exposed to the end user. Spoilers: *It's LINQ all the way down*.

Static Analysis with LINQ
=========================

Out of the box, there's a large collection of static analysis rules; they're mostly focused on finding software design flaws. For example, it includes a rule that warns against assigning a field from too many methods; it's a sign that there's some bug-prone mutation, and a better design could be possible:

.. image:: /img/ndepend/1-too-many-methods.png
    :width: 90%
    :alt: A rule UI that says not to assign a field from many methods. It's a symptom of bug-prone code.
    :align: center

This screen may look like a typical static analysis rule, but there's more going on under-the-hood. If we click the `View Source Code` button, we'll see the following, editable rule code:

.. figure:: /img/ndepend/2-too-many-methods-linq.png
    :width: 90%
    :alt: A LINQ statement. warnif count > 0 from f in JustMyCode.Fields where !f.IsEnumValue && !f.IsImmutable && !f.IsInitOnly && !f.IsGeneratedByCompiler && !f.IsEventDelegateObject let methodsAssigningMe = f.MethodsAssigningMe.Where(m => !m.IsConstructor) where methodsAssigningMe.Count() >= (!f.IsStatic ? 4 : 2) select new { f, methodsAssigningMe, f.MethodsReadingMeButNotAssigningMe, f.MethodsUsingMe, Debt = (4+(f.IsStatic ? 10 : 5)).ToMinutes().ToDebt(), Severity = Severity.High}
    :align: center
    :target: https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1906

.. raw:: html

    <small class="align-center" style="display:block;color:#888"><a href="https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1906">Rule ND1906</a> – click to view the full rule description and code</small>
    
Hey, that's LINQ!

Technically, it's called `CQLinq <https://www.ndepend.com/docs/cqlinq-syntax#Introduction>`_ (Code Query LINQ), which is LINQ with additional static analysis keywords, and running over an object model that represents a codebase. Conceptually, it's similar to Roslyn's syntax/semantic model, but with a bunch of nice affordances and predefined properties that make it simpler to do solution-wide static analysis. The CQLinq object model represents an entire application.

For example, here's a predefined calculation for cyclomatic complexity. It runs across all methods in the application using the ``Application.Methods`` property; there's no need to recursively find all files or classes:

.. image:: /img/ndepend/3-cyclomatic-complexity-query.png
    :width: 90%
    :alt: from m in Application.Methods where m.CyclomaticComplexity > 20 && !m.IsAbstract orderby m.CyclomaticComplexity descending select new { m, m.CyclomaticComplexity }
    :align: center

Notice that the rule uses a ``CyclomaticComplexity`` property that already exists on the method. We can use intellisense to explore other properties in the CQLinq object model:

.. image:: /img/ndepend/4-intellisense.png
    :width: 94%
    :alt: The CQLinq query editor open, with an intellisense menu showing properties like ReadsMutableObjectState, PercentageCoverage, PercentageComment, ShouldBePublic, and many more.
    :align: center

Analyzing code evolution over time with LINQ
============================================

CQLinq also supports comparing the current version of the code with past versions of the code. Analyzing code once will create a *baseline;* future analyses can refer to this baseline with the ``.OlderVersion()`` helper method. Here's how we can identify mutability being introduced as part of a code change:

.. image:: /img/ndepend/5-baseline-mutability-detection.png
    :width: 90%
    :alt: A CQLinq statement that reads: Avoid transforming an immutable type into a mutable one. warnif count > 0 from t in Application.Types where t.CodeWasChanged() && t.OlderVersion().IsImmutable && !t.IsImmutable && !t.IsStatic let culpritFields = t.InstanceFields.Where(f => !f.IsImmutable) select new { t, culpritFields, Debt = (10 + 10*culpritFields.Count()).ToMinutes().ToDebt(), Severity = Severity.High }
    :align: center
    :target: https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1108

.. raw:: html

    <small class="align-center" style="display:block;color:#888"><a href="https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1108">Rule ND1108</a> – click to view the full rule description and code</small>

There are a `bunch of prebuilt rules <https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1105#!>`_ that take advantage of this baseline-comparison feature. For example, we can define and identify breaking changes in a code change to a library, so we don't accidentally break downstream users, and can better manage |SemVer|:

.. |SemVer| raw:: html

  <abbr title="Semantic Versioning">semver</abbr>

.. image:: /img/ndepend/6-breaking-changes.png
    :width: 100%
    :alt: A CQLinq statement that fades out to white. warnif count > 0 from m in codeBase.OlderVersion().Application.Methods where m.IsPubliclyVisible && ((m.WasRemoved() && !m.ParentType.WasRemoved() && !m.IsObsolete) || (!m.WasRemoved() && !m.NewerVersion().IsPubliclyVisible && m.ParentType.NewerVersion().IsPubliclyVisible) || (!m.WasRemoved() && m.ReturnType != null && m.NewerVersion().ReturnType != null && m.ReturnType.FullName != m.NewerVersion().ReturnType.FullName)) 
    :align: center
    :target: https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1500

.. raw:: html

    <small class="align-center" style="display:block;color:#888"><a href="https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html?ruleid=ND1500">Rule ND1500</a> – click to view the full rule description and code</small>

Identifying high-severity issues with LINQ
==========================================

The CQLinq object model doesn't just make our application source code queryable, it also makes static analysis rules and their violations queryable as well. This gets a bit meta; by using the ``Issues`` object model we can query for violations of rules defined by other LINQ statements:

.. image:: /img/ndepend/7-issues-query.png
    :width: 90%
    :alt: from issue in Issues where issue.Severity > Severity.Info orderby issue.Severity descending select new { issue, issue.Severity, issue.CodeElement }
    :align: center

This can be combined with the previous section on code evolution to find new issues, or get an idea of how issues are being introduced or resolved over time. We can use the ``failif`` CQLinq keyword to set hard limits based on our issues and rules; these are known as `Quality Gates` and are useful for continuous integration scenarios. The syntax is the same as the ``warnif`` keyword we saw in the earlier CQLinq rules.

Using the UI for parameterized LINQ queries
===========================================

So far we've been focused on the code editor, but there's also a pretty slick UI; by setting up our LINQ statements to have parameters, we can explore ranges of these parameters in a live-updating, auto-generated UI:

.. image:: /img/ndepend/8-coupling-queries.png
    :width: 90%
    :alt: A UI with several form elements, like input fields, dropdown lists, and sliders. Each form element corresponds to a highlighted placeholder in the LINQ query.
    :align: center

The NDepend UI has a lot of prebuilt views for understanding, categorizing and prioritizing issues. In addition to the typical column views that we've seen in this post, they also have some more `advanced graphical dependency views <https://www.ndepend.com/docs/visual-studio-dependency-graph>`_ that are also powered by CQLinq. All the typical static analysis workflows can be done via the UI if you don't want to get into the LINQ side of things---but where's the fun in that?

If the command line is your preferred form of UI, there's also a command line runner for all these CQLinq statements, which is also useful for integrating with other software.

Summary
=======

This blog post focused solely on the CQLinq part of NDepend, but there's a bunch more `rules <https://www.ndepend.com/default-rules/NDepend-Rules-Explorer.html>`_, `reports <https://www.ndepend.com/sample-reports/>`_, and `data visualizations <https://www.ndepend.com/features/code-complexity#Diagrams>`_ available.

I've personally always been interested in static analysis tools, programming language syntax trees, and LINQ; so it was great to see NDepend use CQLinq to combine all three into a well-packaged static analysis tool.

More practically, it helped me identify a good set of fixes for C# REPL. I was able to refactor towards immutability, better structure some confusing namespaces, and improve the general design of the application.
