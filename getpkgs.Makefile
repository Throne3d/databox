PKGS != find . -mindepth 1 -maxdepth 1 -type d | grep -v ".*\.disabled"

.PHONY: getpkgs $(PKGS)
getpkgs: $(PKGS)

.ONESHELL:
$(PKGS):
	@echo "$@: Started"
	cd $@

	# Version info: $$(makepkg --printsrcinfo | grep pkgver | sed 's/\s*pkgver = //')

	# update pkgbuild details:
	FETCHTEXT=$$(git fetch)
	if [[ $$? != 0 ]]; then
		echo "$@: Git fetch failed"
		echo "$$FETCHTEXT"
		exit 1
	fi

	# clear working directory
	git checkout -- .

	# update to upstream
	UPSTREAM=$$(git branch --format "%(upstream)")
	REBASETEXT=$$(git rebase "$$UPSTREAM")
	if [[ $$? != 0 ]]; then
		echo "$@: Git rebase failed"
		echo "$$REBASETEXT"
		exit 1
	fi

	# check if an update is available:
	makepkg -si --needed --noconfirm && echo "$@: Installed updated version if applicable"
