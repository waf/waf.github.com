Clojure Web Apps with SQL Databases
###################################

:date: 2013-12-04
:tags: [clojure, web, compojure, ring, database, sql, korma, lobos]

.. role:: clojure(code)
   :language: clojure

I've been playing around with Clojure for web applications recently, specifically with the excellent `Ring <https://github.com/ring-clojure/ring>`_ and `Compojure <https://github.com/weavejester/compojure>`_ libraries. 
I've found that most Clojure web application articles out there cover the Ring and Compojure APIs pretty well, but stop short of the data access layer, leaving that up to you. In this article I'll cover useful libraries for interacting with a relational database in web applications.

First, we'll create a simple todo list web application. We'll use Compojure to create a REST API, and set up a quick AngularJS UI to drive our application. Then, we'll use `Korma <http://sqlkorma.com/>`_ to query our PostgreSQL database and `Lobos <http://budu.github.io/lobos/>`_ to manage our SQL migrations.

Creating the REST API
=====================

The first thing we'll do is `set up a Compojure web application <https://github.com/weavejester/compojure/wiki/Getting-Started>`_. Use Leiningen to create and spin up an empty web application:

.. code-block:: console

    > lein new compojure todoapp
    > cd todoapp
    > lein ring server

Your browser should open up to "Hello World" page. Let's make that a little bit more interesting! Keeping the server running, open ``src/todoapp/handler.clj`` in your favorite editor:

.. code-block:: clojure

    (ns todoapp.handler
      (:use compojure.core)
      (:require [compojure.handler :as handler]
                [compojure.route :as route]))

    (defroutes app-routes
      (GET "/" [] "Hello World")
      (route/resources "/")
      (route/not-found "Not Found"))

    (def app
      (handler/site app-routes))

The ``defroutes`` line is setting up our `HTTP request handlers <https://github.com/weavejester/compojure/wiki/Routes-In-Detail>`_. We're defining a "Hello World" response for HTTP GET requests to the root URL. If the incoming request is asking for some other resource, say ``/foo/bar``, the server attempts to find a static resource by that name (in the directory ``resources/public``, by default). If that fails, we'll return a 404 "Not Found" message.

The ``def app`` line takes our routes that we defined, and wraps them with ``handler/site``. This Compojure handler adds useful functionality for websites, like user session tracking, cookie handling, etc. For a full list of added functionality see the `Compojure documentation <http://weavejester.github.io/compojure/compojure.handler.html>`_.

The first thing we'll do is swap out ``handler/site`` for the more barebones ``handler/api``. Since we're building an API we don't need all the bells and whistles like user sessions and cross-page messaging that the site handler provides.

.. code-block:: clojure

    (def app
      (handler/api app-routes))

Next, let's stub out our API. We'll need our typical CRUD operations, so let's remove the "Hello World" route and add the API stubs:

.. code-block:: clojure

    (defroutes app-routes
      (GET "/api/todos" [] "TODO: return all list items")
      (POST "/api/todos" [] "TODO: create a list item")
      (PUT "/api/todos/:id" [id] "TODO: update a list item")
      (DELETE "/api/todos/:id" [id] "TODO: delete a list item")
      (route/resources "/")
      (route/not-found "Not Found"))

When we visit http://localhost:3000/api/todos we should get our stub message "TODO: return all list items" back. However, since we deleted the "Hello World" route that served up the application root, we'll get a "404 Not Found" error when we visit http://localhost:3000/. Let's fix that by adding an "index.html" resource in ``resources/public/``:


