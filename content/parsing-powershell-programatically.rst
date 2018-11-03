Parsing PowerShell Programatically
##################################

:date: 2017-12-16
:tags: [powershell, csharp]

I've recently been working with a lot of PowerShell at work, and the experience has been, well, less than perfect. PowerShell is a dynamically-typed scripting language, and is most often used for administering Windows systems. The combination of making system changes and the runtime errors associated with dynamically-typed languages has been frustrating. It's quite common to get the system into a weird or inconsistent state when developing PowerShell scripts.

Ideally all your PowerShell is properly orchestrated with ``-WhatIf`` and ``SupportsShouldProcess`` functionality, but in my experience it's common for there to be large differences in behavior between ``-WhatIf`` execution and real execution.

The end goal is to move away from large chunks of PowerShell, to something like DSC or Docker. However, while that process is underway, my team and I still have this day-to-day pain point.

The value of a build step
-------------------------

Other dynamically-typed languages also have this problem, most notably JavaScript. However, JavaScript has two mitigations. First, JavaScript is most often used in the context of a browser or servicing an HTTP request. In these scenarios there's rarely persistent state across executions. Second, JavaScript has webpack / TypeScript, which serves as a build step that can catch dumb mistakes like typo-ing a function name or argument value.

For PowerShell, the closest we have is `PSScriptAnalyzer`_, and it helps a lot -- it's a static analysis engine that warns about style and best practice violations. However, it isn't the complete solution. I'm more interested in catching errors like "you're invoking a function that doesn't exist."

PowerShell's built-in parser
----------------------------

Turns out, .NET has great built-in support for parsing and analyzing PowerShell code! It almost rivals Roslyn from the C# world. All the functionality is contained in the namespace `System.Management.Automation.Language`_.

This functionality is available on any ScriptBlock in PowerShell:

.. code-block:: powershell

    > { 1 + 2 }.Ast

    Attributes         : {}
    UsingStatements    : {}
    ParamBlock         :
    BeginBlock         :
    ProcessBlock       :
    EndBlock           : 1 + 2
    DynamicParamBlock  :
    ScriptRequirements :
    Extent             : { 1 + 2 }
    Parent             : { 1 + 2 }

Additionally, because it's all .NET, it's simple to build your own analyzer / linter in C#. The namespace contains a parser to convert a file into an abstract syntax tree:

.. code-block:: csharp

    ScriptBlockAst ast = Parser.ParseFile(
        filename,
        out Token[] tokens,
        out ParseError[] errors
    );

As well as a visitor pattern implementation for traversing the abstract syntax tree:

.. code-block:: csharp

    /// <summary>
    /// AstVisitor is used for basic scenarios requiring traversal of the nodes
    /// in an Ast. An implementation of AstVisitor does not explicitly traverse
    /// the Ast; the engine traverses all nodes and calls the appropriate method
    /// on each node.
    /// </summary>
    public abstract class AstVisitor2
    {
        public virtual AstVisitAction VisitScriptBlock(ScriptBlockAst scriptBlockAst) { return AstVisitAction.Continue; }
        public virtual AstVisitAction VisitFunctionDefinition(FunctionDefinitionAst functionDefinitionAst) { return AstVisitAction.Continue; }
        public virtual AstVisitAction VisitCommand(CommandAst commandAst) { return AstVisitAction.Continue; }
        public virtual AstVisitAction VisitStatementBlock(StatementBlockAst statementBlockAst) { return AstVisitAction.Continue; }
        public virtual AstVisitAction VisitIfStatement(IfStatementAst ifStmtAst) { return AstVisitAction.Continue; }
        public virtual AstVisitAction VisitSwitchStatement(SwitchStatementAst switchStatementAst) { return AstVisitAction.Continue; }
        public virtual AstVisitAction VisitForEachStatement(ForEachStatementAst forEachStatementAst) { return AstVisitAction.Continue; }
        //...etc
    }

    /// <summary>
    /// Each Visit* method in AstVisitor2 returns one of these
    /// values to control how visiting nodes in the AST should proceed.
    /// </summary>
    public enum AstVisitAction
    {
        Continue, // Continue visiting all nodes the ast.
        SkipChildren, // Skip visiting child nodes of currently visited node
        StopVisit, // Stop visiting all nodes.
    }

Finding invalid function invocations
------------------------------------

Let's write a simple linter that detects the following program. It's syntactically correct, but would result in a runtime error due to a missing ``Bar`` function:

.. code-block:: powershell

    function Foo
    {
        Write-Output "Foo"
        Bar
    }

    Foo

We have three functions in the above program: ``Foo``, ``Write-Output`` and our missing function ``Bar``. ``Foo`` is defined in our program, ``Write-Output`` is available in the standard library, and ``Bar`` is undefined and will result in a runtime error.

The basic algorithm for detecting this invalid code is something like this:

1. Visit each node in order
2. If we find a function definition, record the function's name and body.
3. If we find a function invocation, check if it's one of the functions we know about. If so, recursively visit that function's body. If we don't know about it, it's an error that should be reported.

Step 1: Visiting each node in order
-----------------------------------

For Step 1, we simply subclass the provided abstract ``AstVisitor2`` base class.
The base class will visit each node for us, and we can override methods if we want to perform an action.
We'll need to know about what functions are defined already (like ``Write-Output``) so let's take that
as a constructor parameter ``moduleCommands``.

.. code-block:: csharp

    public class AnalysisVisitor : AstVisitor2
    {
        // an initially empty collection that will accumulate the locally-defined functions
        public IImmutableDictionary<string, FunctionDefinitionAst> LocalCommands { get; set; }

        // an collection that has the list of already defined functions, like Write-Output
        public IImmutableDictionary<string, CommandInfo> ModuleCommands { get; set; }

        // The errors we've found during our analysis
        public List<string> ValidationErrors { get; }

        public AnalysisVisitor(
            IImmutableDictionary<string, FunctionDefinitionAst> localCommands
            IImmutableDictionary<string, CommandInfo> moduleCommands)
        {
            this.LocalCommands = localCommands;
            this.ModuleCommands = moduleCommands;
            this.ValidationErrors = new List<string>();
        }
    }

We can call our visitor like so:

.. code-block:: csharp

    var ast = Parser.ParseFile(
        "./myFile.ps1",
        out Token[] tokens,
        out ParseError[] errors
    );
    var fileVisitor = new AnalysisVisitor(
        localFunctions: ImmutableDictionary<string, FunctionDefinitionAst>.Empty,
        moduleFunctions: GetInScopeFunctions()
    );
    ast.Visit(fileVisitor);
    Console.WriteLine("Errors:");
    Console.WriteLine(string.Join(Environment.NewLine, fileVisitor.ValidationErrors));

The function ``GetInScopeFunctions`` is outside the scope of this article, but if you're curious you can `see the definition here`_.

Step 2: Keeping track of function definitions
---------------------------------------------

For Step 2, we add an override for ``VisitFunctionDefinition``. We'll add each visited function definition to our ``LocalCommands`` property:

.. code-block:: csharp

    public override AstVisitAction VisitFunctionDefinition(FunctionDefinitionAst functionDefinitionAst)
    {
        string functionName = functionDefinitionAst.Name;
        if(LocalCommands.ContainsKey(functionName))
        {
            ValidationErrors.Add("Overwriting existing function " + functionName);
        }
        LocalCommands = LocalCommands.SetItem(functionName, functionDefinitionAst);
        // Track that we've seen the function, but don't analyze the body.
        // the body will be analyzed when the function is called.
        // If we tried to analyze the body now, we may find invocations of
        // functions that will be defined later.
        return AstVisitAction.SkipChildren;
    }

Step 3: Following function invocations
--------------------------------------

For Step 3, we'll add another override, this time for ``VisitCommand`` which represents a function invocation. 

- If the invoked command is in our ``ModuleCommands`` variable, we'll skip it, as it's defined in another module. This will handle functions like ``Write-Output``.
- If the invoked command is in our ``LocalCommands`` variable, we'll then recursively visit the function body and merge the result with our overall result.
- If we don't know about the command, then we've identified the error!

.. code-block:: csharp

    public override AstVisitAction VisitCommand(CommandAst commandAst)
    {
        string commandName = commandAst.GetCommandName();

        if (ModuleCommands.ContainsKey(commandName))
        {
            // nothing to analyze, it's in another module (e.g. Write-Output)
            return base.VisitCommand(commandAst);
        }

        if (LocalCommands.TryGetValue(commandName, out var functionDefinition))
        {
            // recursively visit the invoked function's body
            var functionVisitor = new AnalysisVisitor(LocalCommands, ModuleCommands);
            functionDefinition.Body.Visit(functionVisitor);
            MergeResult(functionVisitor);
            return base.VisitCommand(commandAst);
        }

        ValidationErrors.Add(commandName + " is not defined");

        return base.VisitCommand(commandAst);
    }

All done! This very basic analyzer will detect our error. There's all sorts of improvements we can do, such as
support for dot-sourced files and descending into modules, but these features will follow the same pattern as our
simple analyzer.

Overall, I was very impressed with the ease of analysis of PowerShell code. All code in this post is available in my repo PSCommandLint_.

.. _PSScriptAnalyzer: https://github.com/PowerShell/PSScriptAnalyzer
.. _System.Management.Automation.Language: https://docs.microsoft.com/en-us/dotnet/api/system.management.automation.language
.. _PSCommandLint: https://github.com/waf/PSCommandLint
.. _see the definition here: https://github.com/waf/PSCommandLint/blob/d1d579e7d83c526640e8dd2287da005b2ebe025d/PSCommandLint/Analysis/CommandAnalyzer.cs#L75
