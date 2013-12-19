Clojure Web Apps with SQL Databases
###################################

:date: 2013-12-04
:tags: [clojure, web, compojure, ring, database, sql, korma, lobos]

.. role:: clojure(code)
   :language: clojure

I've been playing around with Clojure for web applications recently, specifically with the excellent `Ring <https://github.com/ring-clojure/ring>`_ and `Compojure <https://github.com/weavejester/compojure>`_ libraries. 
I've found that most Clojure web application articles out there cover the Ring and Compojure APIs pretty well, but stop short of the data access layer, leaving that up to you. In this article I'll cover useful libraries for interacting with a relational database in web applications. This article assumes you know the basics of clojure and leiningen.

First, we'll create a simple todo list web application. We'll use Compojure to create a REST API, and set up a quick AngularJS UI to drive our application. Then, we'll use `Korma <http://sqlkorma.com/>`_ to query our PostgreSQL database and `Lobos <http://budu.github.io/lobos/>`_ to manage our SQL migrations.

Generating a Compojure Application
==================================

The first thing we'll do is `set up a Compojure web application <https://github.com/weavejester/compojure/wiki/Getting-Started>`_. Use Leiningen to create and spin up an empty web application:

.. code-block:: console

    > lein new compojure todoapp
    > cd todoapp
    > lein ring server

Your browser should open up to a "Hello World" page on http://localhost:3000/. Let's make that a little bit more interesting! Keeping the server running, open ``src/todoapp/handler.clj`` in your favorite editor and examine the contents:

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

The ``def app`` line takes our routes that we defined, and wraps them with ``handler/site``. This Compojure handler adds useful functionality (called "middleware") for websites, like user session tracking, cookie handling, etc. For a full list of added functionality see the `Compojure documentation <http://weavejester.github.io/compojure/compojure.handler.html>`_.

Setting up a JSON REST API
===========================

Let's modify the middleware stack (the ``def app`` statement) to be more suitable for a REST API. The default ``handler/site`` middleware assumes you're building a website; since we're building a JSON API, we'll swap out ``handler/site`` for the more barebones ``handler/api``, and some middleware for parsing and returning JSON.

In our project.clj file, we'll add a dependency on the `ring-json <https://github.com/ring-clojure/ring-json>`_ library: 

.. code-block:: clojure

  :dependencies [[org.clojure/clojure "1.5.1"]
                 [compojure "1.1.6"]
                 [ring/ring-json "0.2.0"]]

Now we'll add a reference to ring-json in handler.clj:

.. code-block:: clojure

      (:require [compojure.handler :as handler]
                [compojure.route :as route]
                [ring.middleware.json :as json]))

And add the middleware to our application, as well as swapping out ``handler/site`` for the aforementioned ``handler/api``:

.. code-block:: clojure

    (def app
      (-> (handler/api app-routes)
          (json/wrap-json-body)
          (json/wrap-json-response)))

Stubbing out our application
============================

Next, let's stub out our API. We'll need our typical CRUD operations, so let's remove the "Hello World" route and add the API stubs:

.. code-block:: clojure

    (defroutes app-routes
      (GET "/api/todos" [] "TODO: return all list items")
      (POST "/api/todos" [] "TODO: create a list item")
      (PUT "/api/todos/:id" [id] "TODO: update a list item")
      (DELETE "/api/todos/:id" [id] "TODO: delete a list item")
      (route/resources "/")
      (route/not-found "Not Found"))

When we visit http://localhost:3000/api/todos we should get our stub message "TODO: return all list items" back. However, since we deleted the "Hello World" route that served up the application root, we'll get a 404 "Not Found" error when we visit http://localhost:3000/. Let's fix that by adding an "index.html" placeholder resource in the ``resources/public/`` directory:

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
    <body>
        TODO: Make a front-end :)
    </body>
    </html>

Connecting to a Database
========================

Now that we have the REST interface stubbed out, let's move on to the postgres database layer. We'll be using the `Korma <http://sqlkorma.com/>`_ library to query/update our database and `Lobos <http://budu.github.io/lobos/>`_ to manage migrations.

Rather than create our tables manually via ``CREATE TABLE`` statements, let's use Lobos migrations. First we'll need to set up the database connection string (in a new file, database.clj), which we can use for both Korma and Lobos

In our project.clj:

.. code-block:: clojure

        [korma "0.3.0-RC5"]
        [lobos "1.0.0-beta1"]
        [org.postgresql/postgresql "9.2-1002-jdbc4"]]

In database.clj:

.. code-block:: clojure

    (ns todoapp.database
      (:require [korma.db :as korma]
                [lobos.connectivity :as lobos]))

    (def db-connection-info 
      {:classname "org.postgresql.Driver"
       :subprotocol "postgresql"
       :user "db-user"
       :password "SuperSecretPassword"
       :subname "//localhost:5432/todo"})

    ; set up korma
    (korma/defdb db db-connection-info)
    ; set up lobos
    (lobos/open-global db-connection-info)

Now, let's define our migrations.

.. code-block:: clojure

    (ns todoapp.migrations
      (:refer-clojure :exclude 
            [alter drop bigint boolean char double float time complement])
      (:use [todoapp.database]
            [lobos migration core schema]))

    (defmigration add-todo-table
      (up [] (create (table :todos
                            (integer :id :unique)
                            (varchar :title 512))))
      (down [] (drop (table :todos))))

    (defn run-migrations []
      (binding [lobos.migration/*migrations-namespace* 'todoapp.migrations]
        (migrate)))
