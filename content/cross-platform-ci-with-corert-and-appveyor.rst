Cross Platform CI with CoreRT and AppVeyor
##########################################

:date: 2018-10-21
:tags: [csharp, corert, appveyor, continuous-integration]

CoreRT_ is an ahead-of-time (AOT) compiler and runtime for .NET Core. It builds .NET Core applications into a single, small binary that runs without requiring .NET Core to be installed on the system. This makes distribution easy, especially to Mac OS and Linux, which may not have .NET Core installed. On all platforms, the program will have a faster start-up time and lower memory footprint.

Like most developers, I have a pet static site generator I'm working on. As it's a command line utility that will be distributed to users that most likely won't have .NET Core installed, I decided to try CoreRT. The `initial setup`_ was simple, but it took some time to figure out how to set up continuous integration (CI) on AppVeyor. I wanted the CI process to produce binaries artifacts from the ``master`` branch for each platform, add a git tag for the release, and post them to the GitHub Releases page.

One drawback of AppVeyor is that it does not support Mac OS yet. However, there are plans to support it `sometime this year`. I figure that if I have it working on both Windows and Linux, it should hopefully not be too difficult to add Mac OS support.

AppVeyor uses a YAML file for its configuration, and like most CI platforms, there's more than one way to accomplish your goal. I found that the following configuration is a nice mixture of Don't-Repeat-Yourself and maintainability:

.. code-block:: yaml

   version: '0.0.{build}'
   clone_depth: 1
   image:
     # Windows with VS2017
     - Visual Studio 2017
     # default version of 'ubuntu' is old for compatibility reasons. Specify the newest LTS.
     - ubuntu1804
   branches:
     only:
     - master
   # items prefixed with 'cmd:' run only on Windows
   # items prefixed with 'sh:' run only on Ubuntu
   init:
     - cmd: git config --global core.autocrlf true
   install:
     # application dependencies
     - cmd: choco install pandoc
     - sh:  wget https://github.com/jgm/pandoc/releases/download/2.3.1/pandoc-2.3.1-1-amd64.deb && sudo dpkg -i pandoc-2.3.1-1-amd64.deb
     # corert dependencies https://github.com/dotnet/corert/blob/master/Documentation/prerequisites-for-building.md
     - sh:  sudo apt-get install -y clang libkrb5-dev
   before_build:
     - dotnet --version
     - dotnet restore --verbosity m
   build_script:
     - dotnet build
   test_script:
     - cd Nessie.Tests
     - dotnet test
   after_test:
     - cd ..
     - cmd: dotnet publish -c release -r win-x64 -o dist/windows
     # specifying the absolute path here is required to remove paths from archive
     - cmd: 7z a Nessie/dist/windows/nessie-windows-x64.zip %APPVEYOR_BUILD_FOLDER%/Nessie/dist/windows/nessie.exe
     # by default, CoreRT on linux tries to use clang-3.9, reset this to version independent
     # https://github.com/dotnet/corert/issues/5654
     - sh:  export CppCompilerAndLinker=clang
     - sh:  dotnet publish -c release -r linux-x64 -o dist/linux
     - sh:  7z a Nessie/dist/linux/nessie-linux-x64.zip $APPVEYOR_BUILD_FOLDER/Nessie/dist/linux/Nessie
   # for / matrix docs
   # https://www.appveyor.com/blog/2018/04/25/specialized-build-matrix-configuration-in-appveyor/
   for:
     -
       matrix:
         only:
           - image: Visual Studio 2017
       artifacts:
        - path: 'Nessie/dist/windows/nessie-windows-x64.zip'
          name: nessie-windows

     -
       matrix:
         only:
           - image: ubuntu1804
       artifacts:
         - path: 'Nessie/dist/linux/nessie-linux-x64.zip'
           name: nessie-linux
   deploy:
     provider: GitHub
     # encrypted token, it's ok to be in version control
     # https://ci.appveyor.com/tools/encrypt
     auth_token:
       secure: zQl909f8bNxmaKdpgiE730kw9vjsNvoV0SjwN/fk3lv9dy7d9cdhgo0/iz/apRqc
     artifact: nessie-windows, nessie-linux
     prerelease: true
     on:
       branch: master

I won't go through this line-by-line, as hopefully the comments make everything clear. Here are the things that took me a while to figure out:

- Use the image ``ubuntu1804`` if you want up-to-date ubuntu. The normal ``ubuntu`` tag is still 16.04.
- On Ubuntu, you need to run ``sudo apt-get install -y clang libkrb5-dev`` to get the required dependencies for CoreRT.
- ``dotnet publish -c release -r RELEASE_ID`` will generate the binary files. See the `RID Catalog`_ for a list of valid operating system identifiers.
- ``export CppCompilerAndLinker=clang`` is required if you don't want to manually install an ancient version of clang on Ubuntu. This environment variable overrides the default Clang 3.9 that CoreRT uses by default.
- For command line tools, prefix ``sh:`` for linux and ``cmd:`` for windows. For platform-specific configurations that are **not** command line arguments (e.g. the ``artifacts`` configuration) you need to use AppVeyor's matrix configuration. Essentially, the ``only`` is a filter, and the sibling tags like ``artifacts`` will take effect when the condition is true.

.. _CoreRT: https://github.com/dotnet/corert/blob/master/Documentation/intro-to-corert.md
.. _sometime this year: https://help.appveyor.com/discussions/questions/23413-are-there-plans-to-make-mac-os-images-available
.. _RID Catalog: https://docs.microsoft.com/en-us/dotnet/core/rid-catalog

