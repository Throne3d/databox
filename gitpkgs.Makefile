PKGS != find . -mindepth 1 -maxdepth 1 -type d

.PHONY: getpkgs $(PKGS)
getpkgs: $(PKGS)

.ONESHELL:
$(PKGS):
	@echo "$@: Started"
	cd $@
	git diff --quiet HEAD PKGBUILD
	BUILDCHANGED=$$?
# PKGBUILD changed from HEAD, checking it out
	if [[ $$BUILDCHANGED != 0 ]]; then
	  #echo "pkgbuild changed"
	  git checkout -- PKGBUILD
	fi
	PULLOUT=$$(git pull)
	GITPULLED=$$?
	echo $$PULLOUT | grep "Already up-to-date." > /dev/null
	GITTODATE=$$?
	if [[ $$GITPULLED == 0 ]]; then
	  # git pull succeeded
	  if [[ $$GITTODATE != 0 ]]; then
	    echo "$@: Pulled PKGBUILD from git, running makepkg"
	    makepkg -si --noconfirm --needed
	  else
	    echo "$@: PKGBUILD not changed, running makepkg for new version…"
	    # now using pacaur instead of this
	    PKGOUT=$$(makepkg 2>&1)
	    PKGBUILD=$$?
	    if [[ $$PKGBUILD == 0 ]]; then
	      echo "$@: New version built; please install package."
	      echo $$PKGOUT
	    elif (echo $$PKGOUT | grep "package" | grep "has already been built" > /dev/null) then
	      echo "$@: No new version"
	    else
	      echo "$@: Error encountered."
	      echo "$$PKGOUT"
	      exit 1
	    fi
	  fi
	else
	  echo "Git pull failed"
	  echo "$$PULLOUT"
	  exit 1
	fi
