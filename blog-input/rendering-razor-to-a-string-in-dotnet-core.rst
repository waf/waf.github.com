Rendering an ASP.NET Core MVC action to a string
################################################

:date: 2018-07-29
:tags: asp.net, dotnet, razor, csharp

I'm currently going through my "build a static site engine" phase that most developers pass
through at some point in their career. As part of this, I wanted to write a normal ASP.NET
Core application complete with server-side rendering, and then have the option to entirely
pre-render it to disk.

It turns out that this is quite difficult -- StackOverflow and GitHub issues were a barren
wasteland of half-working answers. Most everyone assumes that you have a ControllerContext,
or at least an HttpContext! Rendering it from a command line application was unheard of!

After much experimentation, I managed to get it working! You can see a complete example in
the `RazorToStringExample`_ repository.

For example, here's how you can render the route ``Home/Index`` to a string:

.. code-block:: csharp

    public static class Program
    {
        public static async Task Main(string[] args) // async Main requires C# 7.1
        {
            var website = CreateWebHostBuilder(args).Build();

            // invoke your route to get the model result.
            var model = ((ViewResult)new HomeController().Index()).Model;

            // render the view with the model
            // must be scoped due to an asp.net internal IViewBufferScope service being scoped
            using (var scope = website.Services.CreateScope())
            {
                var renderer = scope.ServiceProvider.GetService(typeof(RazorViewToStringRenderer)) as RazorViewToStringRenderer;
                var html = await renderer.RenderViewToStringAsync("Home/Index", model);
                Console.WriteLine(html);
            }
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();
    }

The magic happens in the RazorViewToStringRenderer, which is `defined here`_. We have to set up a lot of ASP.NET Core services to get everything working, but so far it's handled everything I've been able to throw at it!

.. _Westwind.RazorHosting: https://github.com/RickStrahl/Westwind.RazorHosting
.. _RazorToStringExample: https://github.com/waf/RazorToStringExample
.. _defined here: https://github.com/waf/AspNetCoreMvcToStringExample/blob/master/RazorToStringExample/Services/RazorViewToStringRenderer.cs
