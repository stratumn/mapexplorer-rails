# Copyright 2017 Stratumn SAS. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

$:.push File.expand_path("../lib", __FILE__)

# Maintain your gem's version:
require "mapexplorer/rails/version"

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = "mapexplorer-rails"
  s.version     = Mapexplorer::Rails::VERSION
  s.authors     = ["adrien"]
  s.email       = ["adrien@stratumn.com"]
  s.homepage    = "https://github.com/stratumn/mapexplorer-rails"
  s.summary     = "Rails Engine to display a Map Explorer"
  s.description = "Rails Engine that provides an Action View helper thats displays a Map Explorer"
  s.license     = "MPL-2.0"

  s.files = Dir["{app,config,db,lib,vendor}/**/*", "LICENSE", "Rakefile", "README.md"]

  s.add_dependency "rails", "~> 5.0.0", ">= 5.0.0.1"
  s.add_dependency "turbolinks", "~> 5.0.0", ">= 5.0.0.1"
  s.add_dependency "jquery-rails", "~> 4.2"
  s.add_dependency "sass-rails", "~> 5.0", '>= 5.0.0'

  s.add_development_dependency "sqlite3"
end
