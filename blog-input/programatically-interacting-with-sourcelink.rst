Programmatically Interacting with Source Link
#############################################

:date: 2021-09-01
:tags: [csharp, sourcelink, csharprepl]
:commentid: 6

I recently added a Source Link feature to `C# REPL <https://github.com/waf/CSharpRepl>`_, so users can view the source code of (most) .NET SDK types and NuGet packages. It took a bit of research to understand how Source Link works under the hood; in this post we'll write some C# code to use it programmatically, and arrive at a better understanding of what's going on when we debug into NuGet packages.

First, here's a quick recording of Source Link being used from C# REPL:

.. raw:: html

    <video controls style="width:100%; border-radius: 4px;">
        <source src="/img/sourcelink/csharprepl-sourcelink.mp4" type="video/mp4">
        Sorry, the current browser doesn't support embedded MP4 videos.
    </video>

If you'd like to play around with an early version of the feature in C# REPL, install it via ``dotnet install -g csharprepl`` (or update to the latest version via ``dotnet update -g csharprepl``). Press F12 when the caret is in a class, property, or method; C# REPL will download metadata and open the browser.

This feature builds on top of dotnet's `Source Link <https://github.com/dotnet/sourcelink>`_, which allows NuGet packages to embed references to their source code, with the goal of providing an easy debugging experience. When `Visual Studio  or VS Code is configured <https://devblogs.microsoft.com/dotnet/improving-debug-time-productivity-with-source-link/>`_ to take advantage of Source Link, debugging a NuGet package's source code is as easy as "stepping into" the library with the debugger.

I wanted to take advantage of this feature in the REPL, so it could be used outside of debugging contexts, and provide fast access to source code. I often find myself Googling for library source code to better understand how to use it; so being able to directly pull it up directly from the REPL is a real timesaver.

How Source Link works
=====================

Source Link works by embedding URLs of documents in the PDB metadata. These URLs can point to a wide variety source control providers, like GitHub, GitLab, BitBucket, Azure DevOps, self-hosted options, and more.

NuGet package authors, as part of `opting into Source Link support <https://github.com/dotnet/sourcelink#using-source-link-in-net-projects>`_, will start publishing a ``.snupkg`` (apparently pronounced *snup-keg*) file in addition to the normal ``.nupkg`` (... *nup-keg*) file. These ``.snupkg`` files are symbol packages, and contain the debugging symbols in PDB files, with optional Source Link metadata.

It's also possible to bundle PDB files in the ``.nupkg`` files themselves. This has a benefit of simpler packaging but results in a larger download size. The standard NuGet commands like ``dotnet pack`` and ``dotnet nuget`` handle the packaging for us, so it appears that most libraries on NuGet use separate ``.snupkg`` and ``.nupkg`` packages.

We can use nuget.org (`example <https://www.nuget.org/packages/Newtonsoft.Json/>`_) to check if a package both publishes ``.snupkg`` files and supports Source Link, by looking at the sidebar information for a package:

.. image:: /img/sourcelink/nuget-org.png
    :width: 50%
    :align: center

The *Download Symbols* link shows that the package publishes a ``.snupkg`` file. If we click the *Open in NuGet Package Explorer* link, a `WASM application <https://nuget.info/packages/Newtonsoft.Json/>`_ will open that shows a deeper analysis of the package. It will show if the package supports Source Link:

.. image:: /img/sourcelink/nuget-explorer.png
    :width: 50%
    :align: center

When we use Visual Studio or VS Code to step into a library that supports Source Link, our IDE will automatically download the symbols, look up the Source Link information, and then download the code from the remote URL. It then shows the code in your debugger and allows you to step through it.

Next, we'll see how to do this same source code lookup operation in our own tools.

Looking up source code using C#
==============================================

The entire process can be broken down into 5 steps:

#. Determine the symbol that you want to look up. This would typically be a class, method, or property.
#. Determine the symbol's containing assembly.
#. Download the PDB files from the symbol server.
#. Use the Sequence Point information in the PDB to get line numbers and document names.
#. Extract the Source Link metadata (as JSON) from the PDB files, and find the URL based on the document name.

Step 1 is usually done with Roslyn. 