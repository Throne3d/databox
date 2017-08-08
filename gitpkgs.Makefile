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
	    PKGOUT=$$(makepkg -o 2>&1)
	    PKGLOADED=$$?
	    if [[ $$PKGLOADED == 0 ]]; then
	      # source makepkg libraries and print package names
	      export PKGS=$$(/bin/bash -c 'LIBRARY=$${LIBRARY:-"/usr/share/makepkg"}
	        for lib in "$$LIBRARY"/*.sh; do
	          source "$$lib"
	        done
	        source PKGBUILD
	        print_all_package_names')
	      allbuilt=1
	      echo $$PKGS | while read line ; do
	        if [[ ! -f $$line ]]; then allbuilt=0; fi
	      done
	      if (( allbuilt )); then
	        echo "$@: Package already built"
	      else
	        echo "$@: Building and installing package…"
	        makepkg -si --needed --noconfirm
	      fi
	    fi
	  fi
	else
	  echo "Git pull failed"
	  echo "$$PULLOUT"
	  exit 1
	fi
