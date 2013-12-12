Clojure Web Apps with SQL Databases
###################################

:date: 2013-12-04
:tags: [clojure, web, database, sql, korma, lobos]

I've been playing around with Clojure for web applications recently, specifically with the excellent `Ring <https://github.com/ring-clojure/ring>`_ and `Compojure <https://github.com/weavejester/compojure>`_ libraries. 
I've found that most Clojure web application articles out there cover the Ring and Compojure APIs pretty well, but stop short of the data access layer, leaving that up to you. In this article I'll cover useful libraries for interacting with a relational database.

First, we'll create a simple todo list web application. We'll use Compojure to create a REST API, and set up a quick AngularJS UI to drive our application. Then, we'll use `Korma <http://sqlkorma.com/>`_ to query our PostgreSQL database and `Lobos <http://budu.github.io/lobos/>`_ to manage our SQL migrations.

Creating the REST API
========================

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

The ``defroutes`` line is setting up our `HTTP request handlers <https://github.com/weavejester/compojure/wiki/Routes-In-Detail>`_. We're defining a "Hello World" response for HTTP GET requests to the root URL. If the incoming request is asking for some other resource, say ``/foo/bar``, our server attempts to find a static resource by that name (in the directory ``resources/public``, by default). If that fails, we'll return a 404 "Not Found" message.

The ``def app`` line takes our routes that we defined, and 

The first thing we'll do is change ``handler/site`` to ``handler/api``. These handlers are `provided by Compojure <http://weavejester.github.io/compojure/compojure.handler.html>`_, and wrap our
