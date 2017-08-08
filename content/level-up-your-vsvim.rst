Level up your VsVim
###################

:date: 2017-08-08
:tags: [csharp, vim, visual-studio]

..    include:: <isonum.txt>

If you're like me, you installed Visual Studio, installed VsVim_, and then happily started coding. However, did you know that Visual Studio's semantic understanding and manipulation of your code is exposed to VsVim?

For example, you might already know that pressing ``gd`` in VsVim will "go to the definition" of a method. But what if we want to "go to the implementation" e.g. through an interface to the underlying concrete method? The standard ``Ctrl-F12`` requires some contortions, and maybe requires glancing down at your keyboard.

It's easy to fix this; just add this mapping to your ``~\_vsvimrc``:

.. code-block:: viml

    map gi :vsc Edit.GoToImplementation<CR>

Let's break this down. The overall command is just a standard `vim mapping`_, with the syntax ``:map {keys} {action}``.

- ``gi`` is the key combo we want to press.
- Everything after that is the action that VsVim will execute:

  - ``:vsc`` is VsVim's `Visual Studio Command`_ runner
  - ``Edit.GoToImplementation`` is a command exposed by Visual Studio. 
  - ``<CR>`` is a carriage return (i.e. pressing "Enter"), which executes the command.

Here are some similarly useful mappings:

.. code-block:: viml

    map gr :vsc Edit.FindAllReferences<CR>
    map gp :vsc Edit.PeekDefinition<CR>

Adding your own mappings is easy:

1. Find a Visual Studio command you want to execute. You can explore the commands available in Visual Studio with the Command Window (View |rarr| Other Windows |rarr| Command Window), or by going to Tools |rarr| Options |rarr| Environment |rarr| Keyboard.
2. Add that command mapping to your ``~\_vsvimrc``
3. Reload the configuration by running ``:source ~\_vsvimrc``

More Useful Mappings
====================

Here are some additional mappings I use. I'm using the standard nnoremap_ for a normal mode non-recursive map:

.. code-block:: viml

    let mapleader=","

    " break out of the tyranny of text! Navigate by method
    nnoremap <leader>m :vsc Edit.NextMethod<cr>
    nnoremap <leader>M :vsc Edit.PreviousMethod<cr>

    nnoremap R :vsc Refactor.Rename<cr>

    " jump between compilation errors
    nnoremap <leader>e :vsc View.NextError<cr>
    nnoremap <leader>E :vsc View.PreviousError<cr>

    " testing and debugging
    nnoremap <leader>b :vsc Debug.ToggleBreakpoint<cr>
    nnoremap <leader>r :vsc TestExplorer.RunAllTestsInContext<cr>
    nnoremap <leader>R :vsc TestExplorer.DebugAllTestsInContext<cr>

    " open the change parameter window, a bit fake because it's not a text-object
    nnoremap cia :vsc Refactor.ReorderParameters<cr>

If you find other useful mappings, feel free to share them below!

.. _VsVim: https://github.com/jaredpar/VsVim
.. _Visual Studio Command: https://github.com/jaredpar/VsVim/wiki/VsVim-Nonstandard-Behavior#integration-with-visual-studio
.. _vim mapping: http://learnvimscriptthehardway.stevelosh.com/chapters/03.html
.. _nnoremap: http://learnvimscriptthehardway.stevelosh.com/chapters/05.html#nonrecursive-mapping

