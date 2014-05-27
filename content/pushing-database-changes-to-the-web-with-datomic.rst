Pushing Database Changes to the Web with Datomic
################################################

:date: 2014-05-25
:tags: [clojure, datomic, reagent, sente, websockets, web]

Lately I've been playing around with Datomic_, a database invented by Rich Hickey, the creator of Clojure. 
Datomic feels like a natural extension of Clojure's immutable, persistent datastructures. From Datomic's `architecture documentation`_:

    A Datomic database stores a collection of facts. The facts in a database are immutable; once stored, they do not change. However, old facts can be superseded by new facts over time. The state of the database is a value defined by the set of facts in effect at a given moment in time.

Daniel Higginbotham wrote a great tutorial on the basics of Datomic called `Datomic for Five Year Olds`_, which I highly recommend (even if you are older than five). 

We're going to focus on one aspect of Datomic in this post: the `Transaction Report Queue`_, and how we can use it to push database changes to a web client using websockets. We'll assume some basic Clojure web application experience.

At this point, most blog posts would explain that the web is becomingly increasingly real-time, that users expect this sort of thing, yadda yadda. Instead, let's jump right into what we're building. Hover over or tap the image for a demo:

.. class:: freezeframe
.. image:: /img/datomic-pushing-changes-demo.gif
    :width: 100%

What's going on here? As users connect to our web application, they're assigned a random username (such as "Merry Frog" or "Cheerful Aardvark"). This username is then inserted into a Datomic database, and the change is pushed from the database to all the connected users. The source for this application is `on GitHub`_. We'll walk through how it all works for the rest of this blog post.

Application Design
==================

Here's the basic layout of the application:

.. image:: /img/datomic-push-architecture.png
    :width: 100%

The core piece here is the Transaction Report Queue that resides in our Clojure backend. This blocking queue will provide us with the all of the database transactions that happen against Datomic. Our application reads from this queue in a background thread, and whenever it's notified of a change, it will send it to the connected clients.

The HTTP server is powered by `HTTP Kit`_ and Compojure_. This is not much different than the typical Ring/Compojure Clojure web application stack; we've simply swapped out the standard Jetty Ring adapter for HTTP Kit. This allows us to handle asynchronous requests and websocket connections.

Sente_ is similar to socket.io from the Node.js world. It's an abstraction layer that provides real-time communication over websockets, with an AJAX long-polling fallback. This library has both Clojure and ClojureScript components.

On the client, we'll render the list of users using the ClojureScript library  Reagent_, which wraps Facebook's React library. It's similar in concept to Om.

All communication to Datomic is handled via Datomic's `peer library`_. We'll use this library to both query the database and monitor the transaction report queue.

We pull in all these libraries via Leiningen, plus some logging libraries:

.. code-block:: clojure

  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/clojurescript "0.0-2202"]
                 [http-kit "2.1.18"]
                 [ring "1.2.2"]
                 [compojure "1.1.8"]
                 [com.taoensso/sente "0.14.0"] 
                 [reagent "0.4.2"]
                 [org.clojure/tools.logging "0.2.6"]
                 [ch.qos.logback/logback-classic "1.1.2"]
                 [org.clojure/core.async "0.1.303.0-886421-alpha"]
                 [com.datomic/datomic-free "0.9.4755" 
                     :exclusions [org.slf4j/slf4j-nop
                                  org.slf4j/slf4j-log4j12]]]

The Backend Clojure Code
========================

Let's start with our standard Compojure routing setup. The only change we've made here is to use the httpkit server, and to require the Sente library, which we'll use in a bit:

.. code-block:: clojure

    (ns userlist.server
      (:require [org.httpkit.server :as server]
                [ring.util.response :as response]
                [clojure.tools.logging :as log]
                [compojure.core :refer :all]
                [compojure.handler :as handler]
                [taoensso.sente :as sente]
                [compojure.route :as route]))

    (defroutes app-routes
      (GET "/" [] (response/resource-response "public/index.html"))
      (route/resources "/")
      (route/not-found "404! :(")))

    (def app 
      (-> app-routes
          (handler/site)))

    (defn -main [& args]
      (server/run-server app {:port 3000}))

Now that we're using HTTP kit, we have websocket support. We just need to add an endpoint for the websocket connection. The Sente library has some prebuilt functions that will handle the websocket connections, and also fall back to AJAX long-polling. We can retrieve references to these functions by calling Sente's ``make-channel-socket!``, and passing in a ``:user-id-fn``.

The ``:user-id-fn`` is a way for Sente to associate a connection with a specific user, so if a user connects with multiple devices, a message can be sent to all of that user's devices. In a Real World Application this would be some application-specific user identity. For our demo application, however, we won't worry about this, and just generate a random UUID for the user ID:

.. code-block:: clojure

    (defn- get-user-id [request] 
      (str (java.util.UUID/randomUUID)))

    (def ws-connection (sente/make-channel-socket! {:user-id-fn get-user-id}))

    (let [{:keys [ch-recv send-fn ajax-post-fn ajax-get-or-ws-handshake-fn
                  connected-uids]}
          ws-connection]
      (def ring-ws-post ajax-post-fn)
      (def ring-ws-handoff ajax-get-or-ws-handshake-fn)
      (def receive-channel ch-recv) ; receives inbound messages from clients
      (def channel-send! send-fn) ; send message to a client
      (def connected-uids connected-uids)) ; all connected clients

And now, we can reference the endpoint functions in our Compojure routes:

.. code-block:: clojure

    ;; compojure routes
    (POST "/channel" req (ring-ws-post req))
    (GET  "/channel" req (ring-ws-handoff req))

Let's set up the Datomic database next:


.. code-block:: clojure

    (defn create-db [url]
      (d/create-database url)
      (let [schema (read-string (slurp "resources/roomlist.edn"))
            conn (d/connect url)]
        (d/transact conn schema)
        {:db-connection conn
         :change-queue (d/tx-report-queue conn)}))

.. _Datomic: http://www.datomic.com
.. _architecture documentation: http://docs.datomic.com/architecture.html
.. _`Datomic for Five Year Olds`: http://www.flyingmachinestudios.com/programming/datomic-for-five-year-olds/
.. _Transaction Report Queue: http://blog.datomic.com/2013/10/the-transaction-report-queue.html
.. _on GitHub: https://github.com/waf/push-demo
.. _Sente: https://github.com/ptaoussanis/sente
.. _HTTP Kit: http://http-kit.org/index.html
.. _Compojure: https://github.com/weavejester/compojure
.. _Reagent: https://github.com/holmsand/reagent
.. _peer library: http://docs.datomic.com/integrating-peer-lib.html
