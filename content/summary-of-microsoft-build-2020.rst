Microsoft Build 2020 – Highlights for .NET Developers
#####################################################

:date: 2020-05-22
:tags: [dotnet, csharp, presentation]
:commentid: 2

Over the course of the last three days, Microsoft Build 2020 released a flood of news and announcements.
For those of us who follow the .NET ecosystem, it can be difficult to wade through them all!

I've collected a list of announcements that I think are interesting as a .NET developer, and added short
summaries. The announcements are grouped into four categories: ASP.NET, .NET, Visual Studio and Windows.

In addition, each category is split into "released" (you can use it now!) or "preview / announced"
(you can test it out now, or soon).

ASP.NET
-------

Released
~~~~~~~~

- `Blazor WebAssembly is released! <https://devblogs.microsoft.com/aspnet/blazor-webassembly-3-2-0-now-available/>`_ - v3.2.0 is an official release -- it's not a preview anymore! It's considered ready for production use, but is not a Long Term Support release.
- `Project Tye <https://devblogs.microsoft.com/aspnet/introducing-project-tye/>`_ - a tool for deploying .NET core applications to Kubernetes.

Preview / Announced
~~~~~~~~~~~~~~~~~~~

- `ASP.NET Core updates in .NET 5 Preview 4 <https://devblogs.microsoft.com/aspnet/asp-net-core-updates-in-net-5-preview-4/>`_ - Improved HTTP/2 performance by adding support for HPack dynamic compression. Smaller docker image sizes by sharing layers between upstream images.


.NET
----

Preview / Announced
~~~~~~~~~~~~~~~~~~~

- `.NET 5 Preview 4 <https://devblogs.microsoft.com/dotnet/announcing-net-5-preview-4-and-our-journey-to-one-net/>`_ - C# 9 and F# 5 previews, source generators for compile-time code generation / introspection. Also some updates on publishing to a single file application. ARM processor support for Web / UI applications.
- `C# 9 Preview <https://devblogs.microsoft.com/dotnet/welcome-to-c-9-0/>`_ - A lot of new functional features. This is just a preview -- features listed in this article might not make it into the final release, or might have different syntax after all the design issues have been figured out. But it's still exciting to see C# embrace immutability!
- `F# 5 Preview <https://devblogs.microsoft.com/dotnet/f-5-update-for-net-5-preview-4/>`_ - Better tooling, faster compiling, interoperability with C#'s new "default interface member" feature.
- `As part of .NET 5, Xamarin.Forms library is now called MAUI <https://devblogs.microsoft.com/dotnet/introducing-net-multi-platform-app-ui/>`_ - My guess is everyone will continue to call it Xamarin.Forms. This article also mentions that Xamarin.iOS and Xamarin.Android will be integrated into .NET 6. 
- `YARP Reverse Proxy Preview <https://devblogs.microsoft.com/dotnet/introducing-yarp-preview-1/>`_ - High performance reverse proxy server. Think of it like an application load balancer / rewrite rules engine built as ASP.NET Core middleware.
- `Project Reunion <https://github.com/microsoft/ProjectReunion>`_ - A polyfill library so you can use the same libraries (WinUI 3, WebView2, MSIX) on both WinForms and UWP platforms.

Visual Studio
-------------

Released
~~~~~~~~

- `VS2019 16.6 released, with 16.7 in preview <https://devblogs.microsoft.com/visualstudio/visual-studio-2019-v16-6-and-v16-7-preview-1-ship-today/>`_ - VS2019 16.6 contains a new ".NET Async Tool" for debugging applications. Better snapshot debugging and refactorings. Has a new "Web Tools for Azure" tool, as well as new C++ 20 standard library features.
- `Windows Forms Designer for .NET Core <https://devblogs.microsoft.com/dotnet/windows-forms-designer-for-net-core-released/>`_ - The WinForms designer now works with .NET Core WinForms applications.
- `ML.NET Model Builder in Visual Studio <https://devblogs.microsoft.com/dotnet/ml-net-model-builder-is-now-a-part-of-visual-studio/>`_ - The existing ML.NET Model Builder extension (which is super cool) is now integrated into Visual Studio. Add "Machine Learning" with just two clicks! ...plus years of study.

Preview / Announced
~~~~~~~~~~~~~~~~~~~

.. role:: strike

- `Visual Studio 2019 can be used with Codespaces <https://devblogs.microsoft.com/visualstudio/expanding-visual-studio-2019-support-for-visual-studio-codespaces/>`_ - Visual Studio Online is renamed to Visual Studio Codespaces. Visual Studio 2019 can now serve as a "client ui" to a codespace in the cloud.
- `How to use .NET Core with Visual Studio Codespaces <https://devblogs.microsoft.com/dotnet/using-visual-studio-codespaces-with-net-core/>`_ - A tour of the editing / testing / debugging experience of .NET Core with Visual Studio :strike:`Online` Codespaces.

Windows
-------

Released
~~~~~~~~

- `The new Windows Terminal hit 1.0 <https://devblogs.microsoft.com/commandline/windows-terminal-1-0/>`_ - Supports tabs and split panes. GPU accelerated rendering will display your compile errors blazing fast.

Preview / Announced
~~~~~~~~~~~~~~~~~~~

- `winget - a new windows package manager <https://devblogs.microsoft.com/commandline/windows-package-manager-preview/>`_ - Windows command line package manager like chocolately. As far as I can tell, it does not manage dependencies or updates (yet?).
- `Windows Subsystem For Linux (WSL) 2 <https://devblogs.microsoft.com/commandline/the-windows-subsystem-for-linux-build-2020-summary/>`_ - WSL2 will ship later this month in the Windows 10 May 2020 Update. Docker Desktop for Windows will replatform onto WSL2. GPU support for GPU processing (think CUDA, not intended for games). Linux GUI app support via wayland.

Whew! Even for a short summary, that still ended up being long. It's been an exciting few days for the .NET ecosystem, and .NET 5 promises to keep that excitement alive.

.. raw:: html

    <embed>
        <style>
            .strike { text-decoration: line-through; }
            li { margin: 8px 0 8px 0; }
        </style>
    </embed>
