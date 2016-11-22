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
  s.summary     = "Rails View helper to display a Map Explorer"
  s.description = "Rails View helper to display a Map Explorer"
  s.license     = "MIT"

  s.files = Dir["{app,config,db,lib}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]

  s.add_dependency "rails", "~> 5.0.0", ">= 5.0.0.1"
  s.add_dependency "turbolinks"
  s.add_dependency "jquery-rails"
  s.add_dependency "sass-rails"

  s.add_development_dependency "sqlite3"
end