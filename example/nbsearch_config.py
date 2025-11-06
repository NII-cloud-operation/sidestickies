# NBSearch configuration
import os

c.NBSearchDB.solr_base_url = 'http://localhost:8983'
c.NBSearchDB.s3_endpoint_url = 'http://localhost:9000'
c.NBSearchDB.s3_access_key = os.environ.get('MINIO_ACCESS_KEY', 'nbsearchak')
c.NBSearchDB.s3_secret_key = os.environ.get('MINIO_SECRET_KEY', 'nbsearchsk')
c.NBSearchDB.s3_bucket_name = 'nbsearch'
c.LocalSource.base_dir = '/home/jovyan'
c.LocalSource.server = 'http://localhost:8888/'