for file in ./json_exports/*
do
  wrangler kv:bulk put --binding=MERKLE "$file"; echo "$file"; # remove false to upload in dev env
done

