build_dirs := build node_modules
build_dir := $(foreach dir,$(build_dirs),'$(dir)')
commit_hash := $(shell git rev-parse --short HEAD)

clean:
	rm -rf $(build_dir)
dev:
	$(MAKE) clean; yarn install; yarn dev;
build:
	$(MAKE) clean; yarn install --frozen-lockfile --prod; yarn build;
start:
	 COMMIT_HASH=$(commit_hash) yarn start;
docker-build:
	docker build . --build-arg COMMIT_HASH=$(commit_hash) --tag template
docker-run:
	docker run --rm --env COMMIT_HASH=$(commit_hash) --publish 3000:3000 --name template template
docker-all:
	$(MAKE) docker-build && $(MAKE) docker-run
