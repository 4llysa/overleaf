#!/bin/bash

# redis 
mkdir -p /tmp/$1-pv-redis 
# mongo
mkdir -p /tmp/$1-pv-mongo
# filestore
mkdir -p /tmp/$1-pv-filestore-public-files
mkdir -p /tmp/$1-pv-filestore-template-files
mkdir -p /tmp/$1-pv-filestore-uploads
mkdir -p /tmp/$1-pv-filestore-user-files
# history-v1
mkdir -p /tmp/$1-pv-history-v1-buckets
# Web
mkdir -p /tmp/$1-pv-web-data
mkdir -p /tmp/$1-pv-sharelatex-data
# CLSI
mkdir -p /tmp/$1-pv-clsi-cache
mkdir -p /tmp/$1-pv-clsi-output

chmod 777 /tmp/$1-*