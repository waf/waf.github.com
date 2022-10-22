Troubleshooting Assembly Binding Issues in .NET
###############################################

:date: 2019-03-16
:tags: dotnet, csharp

If you've developed .NET for any length of time, chances are you've run into a gnarly error like this:

*System.IO.FileLoadException: Could not load file or assembly 'AcmeCorp.Foobar.Utilities, Version=1.2.0, Culture=neutral, PublicKeyToken=367d582291c765f7' or one of its dependencies.
The located assembly's manifest definition does not match the assembly reference.*

It's a pretty puzzling error. It means that it **found** version 1.2.0 of a DLL, but did not use it because a different version was requested (e.g. 1.3.0).

There are a couple of gotchas when troubleshooting these types of errors.

Ensure you don't have any version mismatches
--------------------------------------------

As a first step, ensure that all projects in your solution reference the same version of the problematic DLL or NuGet package. This is by far the easiest fix. For NuGet packages in Visual Studio, you can right-click your Solution, choose "Manage NuGet Packages for Solution" and use the "Consolidate" tab to fix the issue.

Use Fusion Logs to better understand the problem
------------------------------------------------

.NET will log more details about the problem to the "Fusion Logs" system. By default, it's disabled. Enable it by opening your "Developer Command Prompt for Visual Studio" from the start menu **as administrator**. Type the command ``fuslogvw`` to start the "Fusion Log Viewer."

.. image:: /img/fuslogvw.png
   :width: 80%
   :align: center

Click the settings button, choose "Log bind failures to disk" and then click OK. Start your application again and you should see more details about the bind failures show up in the Fusion Log Viewer.

If you don't see any log entries show up, there are a few things you can try:

- First try restarting your application and, if you're developing a web application, restarting your App Pool.
- The Fusion Log Viewer surprisingly uses the Internet Explorer cache, so you can try clearing the cache by going to "Internet Options → Browsing History → Delete" and deleting the Temporary Internet Files option. Weird but true!
- If you're using ASP.NET, you'll see additional error information on your ASP.NET error page simply by having Fusion Logs enabled.

Don't forget to disable Fusion Logs when you're done! There's a performance impact for having it enabled.

Create an Assembly Binding Redirect
-----------------------------------

Finally, you can add an `Assembly Binding Redirect`_ to your App.config or Web.config of your entry project by using the `bindingRedirect`_ element. This only works if there are no breaking changes between the two different versions of the DLL.

.. code-block:: xml

    <!-- the following should be placed under the hierarchy <configuration><runtime><assemblyBinding> -->
    <dependentAssembly>
      <assemblyIdentity name="AcmeCorp.Foobar.Utilities" publicKeyToken="367d582291c765f7" culture="neutral" />
      <bindingRedirect oldVersion="0.0.0.0-1.3.0.0" newVersion="1.3.0.0" />
    </dependentAssembly>

The above configuration states "If you find an AcmeCorp.Foobar.Utilities.dll with a version between 0.0.0.0 and 1.3.0.0, redirect it to 1.3.0.0."

**publicKeyToken** can be retrieved using the ``sn`` utility. From your Developer Command Prompt, ``cd`` to the location of your DLL, and run ``sn -T YourDll.dll``. It will display the public key token.

**oldVersion / newVersion** can be confusing. There are many different types of versions that a DLL can have. What we care about is version in the assembly manifest. From your Developer Command Prompt, ``cd`` to the location of your DLL and run ``ildasm YourDll.dll``. ILDASM will open your assembly. Click on the ``MANIFEST`` node, and you'll see a version like ``.ver 1:3:0:0`` which would correspond to version ``1.3.0.0`` in your App/Web.config.

These are all the tricks I've learned to troubleshooting various assembly binding issues. Ideally you can have consistent versions of each DLL in your application, but hey, the world is a complex place!

.. _Assembly Binding Redirect: https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/redirect-assembly-versions
.. _bindingRedirect: https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/file-schema/runtime/bindingredirect-element
