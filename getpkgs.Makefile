PKGS != find . -mindepth 1 -maxdepth 1 -type d

.PHONY: getpkgs $(PKGS)
getpkgs: $(PKGS)

.ONESHELL:
$(PKGS):
	@cd $@
	PULLOUT=$$(git pull)
	GITPULLED=$$?
	echo $$PULLOUT | grep "Already up-to-date." > /dev/null
	GITTODATE=$$?
	if [[ $$GITPULLED == 0 ]]; then
		# git pull succeeded
		if [[ $$GITTODATE != 0 ]]; then
			echo "$@: Pulled from git"
			makepkg -si --needed --noconfirm
		else
	    echo "$@: Package not changed"
	    #makepkg -si --needed --noconfirm
		fi
	else
		echo "$@: Git pull failed"
		echo $$PULLOUT
		exit 1
	fi
