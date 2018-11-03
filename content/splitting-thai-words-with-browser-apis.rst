Splitting Thai words with Browser APIs
######################################

:date: 2017-06-03
:tags: [javascript, thai, tools]

One of the difficulties for students learning the Thai language is the lack of spaces between words. For example, here is a simple sentence in Thai:

.. class:: align-center

    สวัสดีครับกินข้าวหรือยัง

After some time, students start to recognize the shapes of the words and it becomes effortless to read. Before that time, however, it's quite a struggle!

I found a neat trick yesterday for splitting Thai sentences into words with JavaScript in Chrome. There's no native API for understanding Thai text, but it's possible to piggyback on top of the browser's text selection APIs.

When a word is double-clicked in the browser, the browser will select that word---and this selection is localization-aware! This functionality is exposed in the non-standard `Selection.modify`_ API. While this API is present in every browser, I've found it only works on Thai text in Chrome.

``Selection.modify`` is a bit like the old-school "turtle" game where a pen is given a command with a direction and a distance, and it draws a line in that direction for that distance. In our case, we're "drawing" the selection of text. The API looks like this:

.. code-block:: javascript

    sel.modify(alter, direction, granularity)

- **alter**: "move" to move the current cursor position or "extend" to extend a range of selected text.
- **direction**: "forward" or "backward" -- the direction to move/extend the selection. This is a locale-aware definition. Additionally, "left" and "right" are locale-invariant options.
- **granularity**: "character" or "word" -- the distance to move/extend the selection. Chrome implements many more options for this parameter.

For example, ``sel.modify("extend", "forward", "word")`` would extend the current selection forward by one word. By measuring the selection range after each call, we can get the indices of each word.

The actual code ends up being pretty short:

.. code-block:: html

    <div class="input">สวัสดีครับกินข้าวหรือยัง</div>
    <button>↓ split ↓</button>
    <div class="output"></div>

.. code-block:: javascript

    <script>
        document
            .querySelector("button")
            .addEventListener("click", () => {
                const input = document.querySelector('.input');
                const output = document.querySelector('.output');
                const sel = window.getSelection(); // our selection api

                // set selection range to [0, 0]
                output.textContent = '';
                sel.collapse(input, 0);
                var start = 0;
                var end = 0;

                // instruct the browser to select each word, then read the
                // selection and output it.
                while(end < input.textContent.length) {
                    sel.modify('extend', 'forward', 'word');
                    end = sel.focusOffset;
                    const word = input.textContent.substring(start, end);
                    start = end;

                    output.textContent += word + "  ";
                }
            }, false);
    </script>

And here is the result:

.. raw:: html

    <div class="input">สวัสดีครับกินข้าวหรือยัง</div>
    <button>↓ split ↓</button>
    <div class="output"></div>

    <script>
        document
            .querySelector("button")
            .addEventListener("click", () => {
                const input = document.querySelector('.input');
                const output = document.querySelector('.output');
                const sel = window.getSelection(); // our selection api

                // set selection range to [0, 0]
                output.textContent = '';
                sel.collapse(input, 0);
                var start = 0;
                var end = 0;

                // instruct the browser to select each word, then read the
                // selection and output it.
                while(end < input.textContent.length) {
                    sel.modify('extend', 'forward', 'word');
                    end = sel.focusOffset;
                    const word = input.textContent.substring(start, end);
                    start = end;

                    output.textContent += word + "  ";
                }
            }, false);
    </script>

I think this is a pretty neat trick!

.. _Selection.modify: https://developer.mozilla.org/en-US/docs/Web/API/Selection/modify
.. _long-standing bug: https://bugzilla.mozilla.org/show_bug.cgi?id=85686
