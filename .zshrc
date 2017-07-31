# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:/usr/local/bin:$PATH

# Path to your oh-my-zsh installation.
  export ZSH=/home/throne3d/.oh-my-zsh

# Set name of the theme to load. Optionally, if you set this to "random"
# it'll load a random theme each time that oh-my-zsh is loaded.
# See https://github.com/robbyrussell/oh-my-zsh/wiki/Themes
ZSH_THEME="agnoster"

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion. Case
# sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment the following line to disable bi-weekly auto-update checks.
# DISABLE_AUTO_UPDATE="true"

# Uncomment the following line to change how often to auto-update (in days).
# export UPDATE_ZSH_DAYS=13

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# The optional three formats: "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
HIST_STAMPS="yyyy-mm-dd"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load? (plugins can be found in ~/.oh-my-zsh/plugins/*)
# Custom plugins may be added to ~/.oh-my-zsh/custom/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git bundler command-not-found gem screen thefuck heroku)
# gpg-agent ssh-agent

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='mvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch x86_64"

# ssh
# export SSH_KEY_PATH="~/.ssh/rsa_id"

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here, though oh-my-zsh
# users are encouraged to define aliases within the ZSH_CUSTOM folder.
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

DEFAULT_USER="throne3d"

eval $(perl -I${HOME}/perl5/lib/perl5 -Mlocal::lib)

alias win32="WINEPREFIX='$HOME/prefix32' WINEARCH=win32"

function mountgdrive() {
  if [[ ! -e "$HOME/GDriveMount" ]]
  then
    if ! mountpoint -q -- "$HOME/GDriveMount"
    then
      mkdir "$HOME/GDriveMount"
    fi
  fi
  rclone mount gdrive: $HOME/GDriveMount &
}
function unmountgdrive() {
  fusermount -u "$HOME/GDriveMount"
}

function mountonedrive() {
  if [[ ! -e "$HOME/OneDriveMount" ]]
  then
    if ! mountpoint -q -- "$HOME/OneDriveMount"
    then
      mkdir "$HOME/OneDriveMount"
    fi
  fi
  rclone mount onedrive: $HOME/OneDriveMount &
}
function unmountonedrive() {
  fusermount -u "$HOME/OneDriveMount"
}

# to cache C compilation stuff
export PATH="/usr/lib/ccache/bin:$PATH"
export USE_CCACHE=1
export CCACHE_COMPRESS=1

# for the Jack compiler for LineageOS
export ANDROID_JACK_VM_ARGS="-Dfile.encoding=UTF-8 -XX:+TieredCompilation -Xmx4G"

# Add RVM to PATH for scripting. Make sure this is the last PATH variable change.
export PATH="$PATH:$HOME/.rvm/bin"

# Make RM safer
alias rm='rm -I'
unsetopt RM_STAR_SILENT

# Add Scala to PATH
export PATH="$PATH:$HOME/scala-2.12.2/bin"

# distcc
# export DISTCC_HOSTS='192.168.1.160'
# export PATH="/usr/lib/distcc/bin:$PATH"
#export CCACHE_PREFIX="distcc"

# Vulkan
export VULKAN_SDK=/home/throne3d/vulkan/VulkanSDK/1.0.51.0/x86_64
export PATH=$PATH:$VULKAN_SDK/x86_64/bin
export LD_LIBRARY_PATH=$VULKAN_SDK/x86_64/
export VK_LAYER_PATH=$VULKAN_SDK/x86_64/etc/explicit_layer.d
