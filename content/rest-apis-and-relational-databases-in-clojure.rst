REST APIs and Relational Databases in Clojure
#############################################

:date: 2013-12-04
:tags: [clojure, web, compojure, ring, database, sql, korma, lobos]

.. role:: clojure(code)
   :language: clojure

I've been playing around with Clojure for web applications, specifically with the excellent `Ring <https://github.com/ring-clojure/ring>`_ and `Compojure <https://github.com/weavejester/compojure>`_ libraries. 
I've found that most Clojure web application articles out there cover the Ring and Compojure APIs pretty well, but stop short of the data access layer, leaving that up to you. In this article I'll cover useful libraries for interacting with relational databases in web applications. This article assumes you know the basics of Clojure and Leiningen.

In this post we'll create a simple REST API for a todo list web application. We'll use Compojure to create a REST API, `Lobos <http://budu.github.io/lobos/>`_ to create and manage our database tables, and `Korma <http://sqlkorma.com/>`_ to query a PostgreSQL database.

Generating a Compojure Application
==================================

The first thing we'll do is `set up a Compojure web application <https://github.com/weavejester/compojure/wiki/Getting-Started>`_. Use Leiningen to create and spin up an empty web application:

.. code-block:: console

    > lein new compojure todoapp
    > cd todoapp
    > lein ring server

After issuing the ``lein ring server`` command, your browser should open up a "Hello World" page on http://localhost:3000/. Let's make that a little bit more interesting! Keeping the server running, open the generated ``src/todoapp/handler.clj`` file in your favorite editor and examine the contents:

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

The ``defroutes`` line is setting up our `HTTP request handlers <https://github.com/weavejester/compojure/wiki/Routes-In-Detail>`_. An HTTP request handler defines our application's response for a given HTTP request. Currently, we're defining a "Hello World" response for HTTP GET requests to the root URL. If the incoming request is for some other resource, say ``/foo/bar``, the server attempts to find a static resource by that name (in the directory ``resources/public``, by default). If that fails, we'll return a 404 "Not Found" message.

The ``def app`` line takes our routes that we defined, and wraps them with ``handler/site`` function. This Compojure function adds useful functionality (called "middleware") for websites, like user session tracking, cookie handling, etc. For a full list of added functionality see the `Compojure documentation <http://weavejester.github.io/compojure/compojure.handler.html>`_.

Setting up a JSON REST API
===========================

Let's modify the middleware stack (the ``def app`` statement) to be more suitable for a REST API. The default ``handler/site`` middleware assumes you're building a website; since we're building a JSON API, we'll swap out ``handler/site`` for the more barebones ``handler/api``, and add some middleware for parsing and returning JSON.

In our ``project.clj`` file, we'll add a dependency on the `ring-json <https://github.com/ring-clojure/ring-json>`_ library: 

.. code-block:: clojure

  :dependencies [[org.clojure/clojure "1.5.1"]
                 [compojure "1.1.6"]
                 [ring/ring-json "0.2.0"]]

Now we'll add a reference to ring-json in ``handler.clj``:

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

When we visit http://localhost:3000/api/todos we should get our stub message "TODO: return all list items" back. However, since we deleted the "Hello World" route that responded to the root URL, we'll get a 404 "Not Found" error when we visit http://localhost:3000/. Since we specified a static resource route, we can fix 404 error by adding an "index.html" placeholder resource in the ``resources/public/`` directory: 

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
    <body>
        TODO: Make a front-end :)
    </body>
    </html>

Connecting to a Database
========================

Now that we have the REST interface stubbed out, let's move on to the Postgres database layer. We'll be using the `Korma <http://sqlkorma.com/>`_ library to query/update our database and `Lobos <http://budu.github.io/lobos/>`_ to manage migrations.

Rather than create our tables manually via ``CREATE TABLE`` statements, let's use Lobos migrations. First we'll need to set up the database connection string, which we can use for both Korma and Lobos.

In our ``project.clj``, add a reference to Korma, Lobos, and the PostgreSQL driver:

.. code-block:: clojure

        [korma "0.3.0-RC5"]
        [lobos "1.0.0-beta1"]
        [org.postgresql/postgresql "9.2-1002-jdbc4"]]

In a new file, ``src/todoapp/database.clj``, specify the database connection information. We're using an empty database called "todo" with the user "db-user" and the password "SuperSecretPassword":

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

That's it! Now Lobos and Korma know how to connect to our database.

Creating Database Tables with Lobos
===================================

Now, let's use Lobos to create a simple table named "items" with an integer primary key and varchar title. Make a new file called ``src/todoapp/migrations.clj``, and add the following:

.. code-block:: clojure

    (ns todoapp.migrations
      (:refer-clojure :exclude 
            [alter drop bigint boolean char double float time complement])
      (:use [todoapp.database]
            [lobos migration core schema]))

    (defmigration add-todo-table
      (up [] (create (table :items
                            (integer :id :primary-key :auto-inc)
                            (varchar :title 512))))
      (down [] (drop (table :items))))

Unfortunately, one aspect of Lobos's design is rather unidiomatic: it provides a ``(migrate)`` function that, by default, only runs migrations in the ``lobos.migrations`` namespace. My personal preference is to keep my migrations for an application in that application's namespace. We can configure Lobos to run the migrations in our desired namespace by rebinding the ``lobos.migration/*migrations-namespace*`` var, and running the ``(migrate)`` function in that context: 

.. code-block:: clojure

    (defn run-migrations []
      (binding [lobos.migration/*migrations-namespace* 'todoapp.migrations]
        (migrate)))

We can run our migrations to generate our table by calling ``(run-migrations)`` in our REPL:

.. code-block:: console

    > lein repl
    > user=> (use 'todoapp.migrations)
    > user=> (run-migrations)
    add-todo-table
    nil

Now, if you check out the database, you'll see we have a ``items`` table, ready for use! Just for kicks, let's add another migration that will add an ``is_complete`` column to our ``items`` table:

.. code-block:: clojure

    (let [is-complete (table :items
                        (boolean :is_complete (default false)))]
      (defmigration add-is-complete-column
        (up [] (alter :add is-complete))
        (down [] (alter :drop is-complete))))

If we call ``(run-migrations)`` again, Lobos will intelligently alter our tables; it will only run the ``add-is-complete-column`` migration, since it knows it already ran the ``add-todo-table migration``. Lobos has an `extensive API <http://budu.github.io/lobos/doc/uberdoc.frontend.html>`_ that provides many powerful table creation and migration options.

Querying and Inserting Data with Korma
======================================

Now that we have our database all ready to go, let's finish off our application! We'll be replacing our REST API stubs we built earlier with calls to our database, using the Korma library. Korma provides a `nice, composable DSL <http://sqlkorma.com/docs#select>`_ for querying our database.

For simplicity, we'll be adding our database queries in ``src/todoapp/handler.clj``. In a real-life application you'd most likely want to refactor the queries out into their own namespace.

We need to let Korma know about our ``items`` table. We do this by using Korma's ``defentity`` macro. After that, we can use the ``(select)``, ``(insert)``, ``(update)``, and ``(delete)`` functions to manipulate our data:

.. code-block:: console

    > curl -X POST -H "Content-Type: application/json" \ 
        -d '{"title":"remember the milk"}' \
        http://localhost:3000/api/todos

