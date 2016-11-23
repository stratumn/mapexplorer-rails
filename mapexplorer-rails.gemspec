$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "mapexplorer/rails/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "mapexplorer-rails"
  s.version     = Mapexplorer::Rails::VERSION
  s.authors     = ["adrien"]
  s.email       = ["adrien@stratumn.com"]
  s.homepage    = ""
  s.summary     = "Rails Engine to display a Map Explorer"
  s.description = "Rails Engine that provides an Action View helper thats displays a Map Explorer"
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]

  s.add_dependency "rails", "~> 5.0.0", ">= 5.0.0.1"
  s.add_dependency "turbolinks", "~> 5.0.0", ">= 5.0.0.1"
  s.add_dependency "jquery-rails", "~> 4.2"
  s.add_dependency "sass-rails", "~> 5.0.0"

  s.add_development_dependency "sqlite3"
end
