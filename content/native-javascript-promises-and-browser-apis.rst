Native JavaScript Promises and Browser APIs
###########################################

:date: 2014-02-22
:tags: [html5, javascript, promise, web]

One of the interesting evolutions of mainstream JavaScript development has been the widespread adoption of Promises_. Promises simplify asynchronous code. Since JavaScript in the browser uses a single-threaded, callback-based programming model, asynchronicity is everywhere. 

The Problem with Asynchronicity
===============================

Asynchronous patterns are great for keeping UIs responsive and non-blocking, but they have a cost: asynchronous JavaScript code tends to be highly nested, which hurts readability. Additionally, because you can't catch errors that are thrown inside callbacks from outside those callbacks, error handling needs to be spread throughout every level of nesting. 

When we use Promises, our code structure is flattened, and our error handling code can be consolidated into a single area. This makes our code easier to both understand and modify. As a result, Promises have taken the JavaScript ecosystem by storm.

The Native Promise API
=======================

Historically, we've used libraries such as q.js_ to add Promises to our applications. However, with ECMAScript 6 `adding Promises to its specification`_ and recent versions of Chrome and Firefox shipping with support (since Chrome 33 and Firefox 29), we can start using native JavaScript Promises -- no libraries required!

It's not all roses, though. Almost all of the existing browser APIs are callback-based, so they require a thin wrapper be able to use Promises. Let's walk through wrapping a couple of browser APIs to add support for native JavaScript Promises.


If you've used q.js Promises before, you'll find the `native Promise API`_ very familiar. At its heart, there's a global ``Promise`` interface. We instantiate a Promise object that represents an asynchronous operation. and use methods on the Promise object to chain together multiple Promises (and thus multiple asynchronous operations). 

A Promise object can do one of two things:

- Eventually return a value
- Eventually encounter an error

In JavaScript Promise parlance, returning a value is known as **resolving** and encountering an error is known as **rejecting**. When we construct a promise, we specify when it resolves and when it rejects.

Promises and the Geolocation API
================================

As an example, let's add promise support to the Geolocation API. The Geolocation API exposes the ``getCurrentPosition`` function, which makes a request for the user's geographical position. The function takes an success callback and an error callback. If everything goes well, the success callback is called with the user's coordinates as a parameter. If the user denies our request, or we can't determine the user's position, the error callback is called. A invocation of this function `without` Promises might look something like:

.. code-block:: javascript
    
    function getUserPosition(success, error) {
        navigator.geolocation.getCurrentPosition(success, error);
    }

    getUserPosition(
        function(position) {
            // we have the user's position!
        }, 
        function(error) {
            // uhoh, something went wrong.
        }
    );

The code is kind of inside-out; we have to wrap up the core of what we want to do (get the user's position) in a function and pass it deep into the program. Let's fix this by using Promises. 

Remember that a Promise can either **resolve** or **reject**. The mapping from resolve to the success callback and from reject to the error callback is pretty clear. It's simple to wrap this browser API in a Promise:

.. code-block:: javascript
    
    function getUserPosition() {
        return new Promise(function(resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }

We can invoke the function to get our promise, and then specify success and failure callbacks using the ``then()`` method on our Promise object:

.. code-block:: javascript
    
    getUserPosition()
        .then(function(position) {
            // we have the user's position!
        })
        .catch(function(error) {
            // uhoh, something went wrong
        });

At first blush, this might not seem much better. However, notice that when we call ``getUserPosition``, the function returns, and `then` we handle the position. In the callback-based version, we handled the position from `inside` the ``getUserPosition`` function.

While this is a significant change, there's not much benefit with just one asynchronous operation. The benefits start compounding when we compose multiple asynchronous operations. To exercise this, let's add another asynchronous operation: displaying the user's position in an HTML5 Notification.

Promises and the HTML5 Notification API
=======================================

The HTML5 Notification API is also callback-based, but in a different way than the Geolocation API: it uses a single ``handleStatus`` callback, rather than separate callbacks for success and errors. The callback-based code might look like this:

.. code-block:: javascript

    function getNotificationPermission(handleStatus) {
        Notification.requestPermission(handleStatus);
    }

    getNotificationPermission(function(status) {
        if(status === "granted") {
            // we can show notifications!
        } else {
            // error, permission denied :(
        }
    });

For this conversion, we'll manually call the ``resolve`` and ``reject`` handlers:

.. code-block:: javascript
    
    function getNotificationPermission() {
        return new Promise(function(resolve, reject) {
            Notification.requestPermission(function(status) {
                if(status === "granted") {
                    resolve(status);
                } else {
                    reject("Notification status " + status);
                }
            });
        });
    }

    getNotificationPermission()
        .then(function(permission) {
            // we can show notifications!
        })
        .catch(function(error) {
            // error, no permission
        });

Notice that the native browser APIs for Geolocation and Notification originally used two slightly different callback patterns, but in our Promise-based API, we have a single, unified execution pattern! Now we can easily compose these two operations and start to see the benefits of Promises.

Composing our Promises
======================

Now, let's write some sample code to flex our Promise API. We'll perform the following actions:

#. Ask permission to display notifications.
#. Ask for the user's position.
#. Show a notification displaying the user's position.
#. Handle all of the failure points in the above steps.

We can reuse our ``getNotificationPermission`` and ``getUserPosition`` functions we defined earlier. Here is the code, in its entirety:  

.. code-block:: javascript

    getNotificationPermission()
        .then(getUserPosition)
        .then(displayNotification)
        .catch(function(error) {
            // error, something went wrong.
        });

    // we defined this function earlier
    function getNotificationPermission() {
        return new Promise(function(resolve, reject) {
            Notification.requestPermission(function(status) {
                if(status === "granted") {
                    resolve(status);
                } else {
                    reject("Notification status " + status);
                }
            });
        });
    }

    // we defined this function earlier
    function getUserPosition() {
        return new Promise(function(resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    }

    // new function. displays lat/lng coordinates in a notification
    function displayNotification(position) {
        new Notification(position.coords.latitude + "," + 
                         position.coords.longitude);
    }

Even though we're dealing entirely with asynchronous operations, our code reads just like synchronous code. Additionally, the error-handling code resembles a try-catch block we might see in normal synchronous code! If an error is thrown in any of our functions, our ``catch`` function will take over. In this error handler function we can check the error object to figure out exactly what went wrong and display the appropriate error message to the user.

Altering the Program Flow
============================

Right now we're chaining all of our functions together, one after the other. This causes some inefficiency and a poor user experience: We request permission for notifications and wait to receive it, and then we request the user's position and wait to receive it. Since these requests don't depend on each other, ideally we would issue both of these requests at once, and then wait until both of the requests were successful.

The Promise API has a solution. The static function ``Promise.All()`` converts multiple promises into a single promise that resolves when all input promises resolve, or rejects when any input promise rejects. This is exactly what we need for our desired behavior:

.. code-block:: javascript

    Promise.all([
        requestNotificationPermission(),
        getUserPosition()
    ])
    .then(displayPosition)
    .catch(function(err) {
        // error, something went wrong.
    });

    function displayPosition(results) {
        var position = results[1];
        new Notification(position.coords.latitude + "," + 
                         position.coords.longitude);
    }

Now, we make both requests and wait until both promises resolve. The values the promises resolve to are passed in an array to the ``displayPosition`` function. We only care about the return value of the ``getUserPosition`` call, so we index into the results array and retrieve the position.

The Future
==========

It's worth noting that the need to wrap Browser APIs in compatibility layers will hopefully be a short-term pain. There are plans to add Promise support to existing browser APIs where possible. We're not there yet, though, so we need these wrappers for now.


.. _Promises: http://en.wikipedia.org/wiki/Promise_(programming)
.. _q.js: http://documentup.com/kriskowal/q/
.. _adding Promises to its specification: https://github.com/domenic/promises-unwrapping
.. _native promise API: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
