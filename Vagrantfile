Vagrant.configure("2") do |config|

  config.vm.box = "bento/ubuntu-24.04"

  ##############################
  ## Frontend VM
  ##############################

  config.vm.define "frontend" do |frontend|

    frontend.vm.hostname = "frontend"

    frontend.vm.network "private_network",
      ip: "192.168.56.10"

    frontend.vm.provider "vmware_desktop" do |vm|
      vm.memory = 2048
      vm.cpus = 2
    end

    frontend.vm.synced_folder ".", "/vagrant"
    frontend.vm.provision "shell", path: "scripts/provision.sh"

  end

  ##############################
  ## Backend VM
  ##############################

  config.vm.define "backend" do |backend|

    backend.vm.hostname = "backend"

    backend.vm.network "private_network",
      ip: "192.168.56.11"

    backend.vm.provider "vmware_desktop" do |vm|
      vm.memory = 2048
      vm.cpus = 2
    end

    backend.vm.synced_folder ".", "/vagrant"
    backend.vm.provision "shell", path: "scripts/provision.sh"

  end

  ##############################
  ## Database VM
  ##############################

  config.vm.define "database" do |database|

    database.vm.hostname = "database"

    database.vm.network "private_network",
      ip: "192.168.56.12"

    database.vm.provider "vmware_desktop" do |vm|
      vm.memory = 2048
      vm.cpus = 2
    end

    database.vm.synced_folder ".", "/vagrant"
    database.vm.provision "shell", path: "scripts/provision.sh"

  end

end