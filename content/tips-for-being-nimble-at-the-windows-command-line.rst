Tips for being nimble at the Windows Command Line
#################################################

:date: 2021-05-10
:tags: [windows-terminal, powershell, zsh]
:commentid: 4

.. role:: strike

The command line experience on Windows has historically been less than stellar. The last few years, however, we've seen rapid improvement. In this post, I'll cover three different areas of improvement, along with some concrete tips in each topic that are real timesavers:

#. The new Windows Terminal
#. Running PowerShell Core
#. Developing with Windows Subsystem for Linux

Even if you're familiar with all three of these topics, I hope at least one of the tips will be new to you!

The new Windows Terminal
========================

Microsoft's release of Windows Terminal, a modern, GPU-accelerated and open-source terminal application, is a real game changer. It can be installed and updated `from the Microsoft store <ms-windows-store://pdp/?ProductId=9n0dx20hk701>`_, with other methods of installation available `on GitHub <https://github.com/microsoft/terminal>`_.

Windows Terminal supports running various shells in tabs (and side-by-side panes). For example, we can use PowerShell in one tab, ZSH under the Windows Subsystem for Linux in another tab, and to the side, a Command Prompt :strike:`pain` pane.

Windows Terminal is ultra-configurable, and uses JSON for its configuration store (with a work-in-progress Settings UI layered on top). An example of this configurability is the ``sendInput`` command, which can send arbitrary keystrokes and escape sequences to the terminal:

For example, we could bind a frequently used ``git log`` command to `Ctrl+Alt+L`:

.. code-block:: JSON

    // place this keybinding in the `actions` array
    {
        "command": {
            "action": "sendInput",
            "input": "git log --all --decorate --oneline --graph\r\n"
        },
        "keys": "ctrl+alt+l"
    },

Git, of course, has its own aliasing system, but it's nice to have a keyboard shortcut for it, too. I personally also keybind some frequent directory navigation commands, as well as invoking common compiler / build tool commands.

Running PowerShell Core
=======================

When most people think of PowerShell, they probably think of the older PowerShell 5, which is the default version of PowerShell installed on Windows. This version of PowerShell is **old** (the most recent point release was 5.1, in 2017).

PowerShell Core, the cross-platform, open-source alternative, has been around since 2016 and is actively developed. It runs alongside PowerShell 5, instead of replacing it, so there's no risk in installing it. It can be installed from the `Microsoft Store <ms-windows-store://pdp/?ProductId=9mz1snwt0n5d>`_ or `GitHub <https://github.com/PowerShell/PowerShell>`_

PowerShell Core has a lot of nice improvements across the usability of its shell, its programming language, and its performance. It's worth upgrading just for the ``cd -`` and ``cd +`` features, which navigate back and forward through the working directory history:

.. code-block:: shell-session

    will@home:~$ cd projects/death-ray

    will@home:~/projects/death-ray$ cd node_modules

    will@home:~/projects/death-ray/node_modules$ cd -

    will@home:~/projects/death-ray$ cd -

    will@home:~$ cd +

    will@home:~/projects/death-ray$
    
Developing with Windows Subsystem for Linux
===========================================

Now, it might be odd for a "Windows Command Line" blog post to recommend installing Linux, but, well, here we are. The Linux / BSD / Mac OS communities have been setting the standard in command line efficiency, and we can get all that goodness on Windows 10, too.

The Windows Subsystem for Linux 2 (WSL2) provides a real Linux command line inside Windows, with Linux kernel updates shipped via Windows Update (!!!). After `installing WSL2 <https://docs.microsoft.com/en-us/windows/wsl/install-win10>`_, we can download distros like `Ubuntu from the Microsoft Store <ms-windows-store://pdp/?ProductId=9nblggh4msv6>`_. From there, advanced shells like ZSH and Fish are just an ``apt install`` away!

While the typical GNU/Linux command line tools, like ``grep`` and ``sed``, are great, we can make it even better. When we run the ``code`` command inside WSL2, it will launch Visual Studio Code on Windows, and set up a client/server bridge to WSL2 automatically. This allows us to use the Visual Studio Code front-end on Windows, with all the IDE / editor features it supports, and it will communicate with our WSL2 backend to actually execute the program.

This way, we can use the WSL2 command line from Windows Terminal, with our code executing under WSL2, but we get a graphical editing and debugging experience:

.. image:: /img/windows-terminal-vscode-with-wsl2.png
    :width: 100%

This is especially useful when doing development in languages where Windows is a bit of a second-class citizen, like on NodeJS or Python.

Enjoy this? You can get more!
=============================

You can find all these tips and many more in my new book, `Windows Terminal Tips, Tricks, and Productivity Hacks <https://www.amazon.com/dp/B08XK8C5FD>`_. Thanks for reading!

.. raw:: html

    <embed>
        <style>
            .strike { text-decoration: line-through; }
            li { margin: 8px 0 8px 0; }
        </style>
    </embed>
