# Mapexplorer::Rails
Exposes a simple view helper that displays a Map Explorer.

## Usage
```erb
<%= mapexplorer(application_url: 'http://localhost:3333', map_id: '00583e40-2a91-497b-83bb-ab82ea143324') %>

<%= mapexplorer(chainscript: my_chainscript_array) %>
```

## Installation
Add this line to your application's Gemfile:

```ruby
gem 'mapexplorer-rails'
```

And then execute:
```bash
$ bundle
```

Or install it yourself as:
```bash
$ gem install mapexplorer-rails
```

## Contributing
Contribution directions go here.

## License
The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).
