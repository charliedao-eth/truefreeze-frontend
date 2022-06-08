for file in ./json_exports/*
do
  wrangler kv:bulk put --binding=MERKLE "$file"; # add --preview to upload in dev env
done

