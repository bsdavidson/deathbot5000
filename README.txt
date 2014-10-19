

██████╗ ███████╗ █████╗ ████████╗██╗  ██╗██████╗  ██████╗ ████████╗
██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║  ██║██╔══██╗██╔═══██╗╚══██╔══╝
██║  ██║█████╗  ███████║   ██║   ███████║██████╔╝██║   ██║   ██║
██║  ██║██╔══╝  ██╔══██║   ██║   ██╔══██║██╔══██╗██║   ██║   ██║
██████╔╝███████╗██║  ██║   ██║   ██║  ██║██████╔╝╚██████╔╝   ██║
╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝

███████╗ ██████╗  ██████╗  ██████╗
██╔════╝██╔═████╗██╔═████╗██╔═████╗
███████╗██║██╔██║██║██╔██║██║██╔██║
╚════██║████╔╝██║████╔╝██║████╔╝██║
███████║╚██████╔╝╚██████╔╝╚██████╔╝
╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝


To get the server running, you'll first need Ruby and Bundler installed. On a
Mac, you can do this with:

    brew install ruby
    gem install bundler

Then use bundler to install the dependencies:

    bundle install

To run the server, and auto-reload when changes are made:

    bundle exec rerun -- bundle exec rackup

To run the tests:

    bundle exec rspec

Or to run them whenever something is changed:

    bundle exec rerun -- bundle exec rspec
