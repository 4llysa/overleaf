#!/bin/bash

# redis 
rm -fr /tmp/$1-pv-redis 
# mongo
rm -fr /tmp/$1-pv-mongo
# filestore
rm -fr /tmp/$1-pv-filestore-public-files
rm -fr /tmp/$1-pv-filestore-template-files
rm -fr /tmp/$1-pv-filestore-uploads
rm -fr /tmp/$1-pv-filestore-user-files
# history-v1
rm -fr /tmp/$1-pv-history-v1-buckets
# Web
rm -fr /tmp/$1-pv-web-data
rm -fr /tmp/$1-pv-sharelatex-data
# CLSI
rm -fr /tmp/$1-pv-clsi-cache
rm -fr /tmp/$1-pv-clsi-output
