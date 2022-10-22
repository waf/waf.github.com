Finding Dead C# Code in an ASP.NET application
##############################################

:date: 2016-08-13
:slug: finding-dead-csharp-code-in-aspnet
:tags: csharp, analysis, opencover

Large, long-lasting codebases tend to accumulate unused code, or dead code, over time. This happens as features are added, changed and removed.

Some types of dead code, like unreferenced methods, are easy to detect with Visual Studio's out-of-the-box static analysis. However, other types of dead code are trickier; maybe there's a method that's only referenced by unit tests, or it's referenced under a condition that's never valid:

.. code-block:: csharp

    if (DateTime.Now < new DateTime(1970, 1, 1))
    {
        // some dead code
    }

How can we detect this type of dead code? Rather than using static analysis to detect it, we can use dynamic analysis---the same technique used to measure unit test code coverage. 

In this post we will use OpenCover_, an open source code coverage tool, to run the dynamic analysis. When we run our application under OpenCover, it will `instrument our code`_ and record what lines were executed. It will then output a coverage report we can process with ReportGenerator_ to visualize the results. Both OpenCover and ReportGenerator can be downloaded from their respective homepages, or through Nuget.

A Sample Application
====================

Let's see this in action! Here's a sample ASP.NET application, with some hard-to-detect dead code. The relevant portion is in HomeController.cs:

.. code-block:: csharp

    public class HomeController : Controller
    {
        public ActionResult Index(DateTime? eventDate)
        {
            var model = new EventViewModel
            {
                DateDescription = eventDate.HasValue ?
                                  HumanFriendlyTime(eventDate.Value) :
                                  string.Empty
            };
            return View(model);
        }

        private string HumanFriendlyTime(DateTime eventDate)
        {
            var today = DateTime.Now.Date;
            var tomorrow = today.AddDays(1);
            if(eventDate == tomorrow)
            {
                return "Event is tomorrow";
            }
            if (today > tomorrow)
            {
                return "Time-traveling detected. Dispatching time police.";
            }
            if (eventDate >= today)
            {
                return $"Event is in {(eventDate - today).Days} days";
            }
            return $"Event was {(today - eventDate).Days} days ago";
        }
    }

Our goal is to detect the ``today > tomorrow`` code block as dead code. Let's target OpenCover at the ASP.NET application. We can use IIS or IISExpress:

Using IIS:

.. code-block:: console

    > net stop w3svc /y
    > OpenCover.Console.exe -target:"C:\Windows\System32\inetsrv\w3wp.exe" -targetdir:"C:\Path\To\WebApp\web\bin" -targetargs:-debug -register:user

Using IISExpress:

.. code-block:: console

    > OpenCover.Console.exe -target:"C:\Program Files (x86)\IIS Express\iisexpress.exe" -targetdir:"C:\Path\To\WebApp\Web\bin" -targetargs:"/site:WebApp /config:\"C:\Path\To\WebApp\.vs\config\applicationhost.config\"" -register:user

OpenCover has `many configuration options`_ we can use to tweak the behavior, including filters by namespace or attribute.

After starting OpenCover, we can send HTTP requests to the application to fully exercise it. This can be scripted, or done manually using a browser.

.. code-block:: console

    # exercise the 'tomorrow' code path
    > wget http://localhost/?eventDate=2016-08-14
    # exercise the 'in X days' code path
    > wget http://localhost/?eventDate=2016-08-29
    # exercise the 'X days ago' code path
    > wget http://localhost/?eventDate=2016-07-10

When we're done sending requests to the application, we can stop OpenCover by pressing 'q'. OpenCover will generate our coverage results in a file called ``results.xml``. We can then use the ReportGenerator to create an HTML report:

.. code-block:: console

    > ReportGenerator.exe -reports:".\results.xml" -targetdir:report

And we're done! ReportGenerator will create a nice report for us, showing the lines of code that are unused (including Razor files):

.. image:: /img/opencover-dead-code.png
    :width: 80%
    :align: center

This technique depends on us being able to fully exercise all parts of the web application. That could be the hardest part, depending on how large the application is. Tooling like OpenCover and ReportGenerator make the rest of it easy!

.. _OpenCover: https://github.com/OpenCover/opencover/
.. _ReportGenerator: http://danielpalme.github.io/ReportGenerator/ 
.. _many configuration options: https://github.com/OpenCover/opencover/wiki/Usage/
.. _instrument our code: https://en.wikipedia.org/wiki/Instrumentation_(computer_programming)
