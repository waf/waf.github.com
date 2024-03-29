New major release of CSharpRepl 0.4.0
#####################################

:date: 2022-10-23
:tags: csharp, dotnet, cli, csharprepl
:commentid: 7

I'm happy to announce a new major release of `CSharpRepl`_, a cross-platform command-line `REPL`_ for C#. This release is special because it almost entirely consists of contributions from the open-source community! In this post we'll walk through a few of the new features.

If you haven't heard of CSharpRepl before and want to try it out, install it as a dotnet tool by running ``dotnet tool install -g csharprepl``, then running ``csharprepl`` once the installation completes. If you've had it installed for a while already, update to the latest version by running ``dotnet tool update -g csharprepl``.

Special recognition and thanks goes to contributor `@kindermannhubert`_, who added the vast majority of these new features, and contributed countless bug fixes, performance improvements and usability enhancements.

Visual Studio Dark Theme by Default
===================================

The default theme for CSharpRepl has changed from the terminal's default colors to the Visual Studio Dark Theme:

.. figure:: /img/csharprepl/csharprepl-darkmode.png
    :alt: csharprepl dark mode
    :target: /img/csharprepl/csharprepl-darkmode.png
    :width: 100%

    In the background, Visual Studio in dark mode. In the foreground, CSharpRepl with a matching theme.

This should provide a better out-of-the-box experience for most users, and more advanced users can either use the ``--useTerminalColorPalette`` flag to restore the previous behavior, or provide their own theme using a `theme.json`_ file.

New Autocompletion Menu
=======================

CSharpRepl now has a revamped autocompletion menu, with behavior closer to Visual Studio and Visual Studio Code. It also supports in-menu syntax-highlighting and navigating through method overloads with per-parameter context-sensitive help.

.. raw:: html

    <video controls style="width:100%; border-radius: 4px;">
        <source src="/img/csharprepl/csharprepl-autocompletion.mp4" type="video/mp4">
        Sorry, the current browser doesn't support embedded MP4 videos.
    </video>

In addition, if you provide the new ``--useUnicode`` parameter, the menu will use unicode glyphs to distinguish between properties, methods, events and other syntax types:

.. figure:: /img/csharprepl/csharprepl-decorations.png
    :alt: csharprepl unicode glyphs in menu
    :target: /img/csharprepl/csharprepl-decorations.png
    :width: 100%

Automatic formatting and indentation of input
=============================================

CSharpRepl has always supported multi-line editing, but the lack of automatic indentation and formatting could be frustrating. Now, the multi-line editing experience is much better: automatic indentation kicks in based on the nesting level of braces, and automatic formatting kicks in whenever a brace or semicolon is typed:

.. raw:: html

    <video controls style="width:100%; border-radius: 4px;">
        <source src="/img/csharprepl/csharprepl-formatting.mp4" type="video/mp4">
        Sorry, the current browser doesn't support embedded MP4 videos.
    </video>

Referencing a solution now references all projects
==================================================

Previously when loading a solution into CSharpRepl, only the final project and its dependencies were added as references. Now, all projects in the solution will be added as references. This should especially help when solutions have multiple projects that serve as entry points. Thanks `@Luiz-Ossinho`_ for this feature!

New configuration file
======================

CSharpRepl starts quickly and minimizes time-to-interactivity. However, that's not worth much if you need to spend time typing a bunch of command line configuration options every time you launch the REPL! While the default configuration should work for most people, bespoke REPL setups aren't uncommon.

Towards that end, CSharpRepl now supports a configuration file that is simply a list of command-line options, one per line, with optional comments. This file format (`.rsp`_) is common to both msbuild.exe and csi.exe. Run ``csharprepl --configure`` to launch your editor opened to this configuration file.

Additionally, the new configuration file supports many more options in this release, including configurable keybindings.

Learning More
=============

This is one of the larger releases CSharpRepl has ever had, and I'm excited for it. To learn more, `visit CSharpRepl on GitHub`_!

.. _CSharpRepl: https://github.com/waf/CSharpRepl
.. _REPL: https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop
.. _@kindermannhubert: https://github.com/waf/CSharpRepl/pulls?q=is%3Apr+author%3Akindermannhubert
.. _theme.json: https://github.com/waf/CSharpRepl/blob/main/CSharpRepl/themes/dracula.json
.. _@Luiz-Ossinho: https://github.com/Luiz-Ossinho
.. _.rsp: https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-response-files?view=vs-2022
.. _visit CSharpRepl on GitHub: https://github.com/waf/CSharpRepl
