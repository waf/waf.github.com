Databases in Clojure Web Apps
#############################

:date: 2013-12-04
:tags: [clojure, web, database, sql, korma, lobos]

I've been playing around with Clojure for web applications recently, specifically with the excellent `Ring <https://github.com/ring-clojure/ring>`_ and `Compojure <https://github.com/weavejester/compojure>`_ libraries. 
I've found that most Clojure web applications articles out there cover the Ring and Compojure APIs pretty well, but stop short of the data access layer, or at least give it short shrift.

In this article we'll briefly touch on the Ring and Compojure APIs, and set up a quick UI to drive our application, but the majority of the article will be focused on using the `Korma <http://sqlkorma.com/>`_ and `Lobos <http://budu.github.io/lobos/>`_ Clojure libraries to query and manage our database, respectively.
