//= require jquery
//= require turbolinks
//= require d3
//= require jsrender
//= require dist/mapexplorer-core

document.addEventListener('turbolinks:load', function() {

  $('.mapexplorer').each(function() {
    var map = $(this);
    var helpers = {
      json: function(val) {
        return JSON.stringify(val, undefined, 2);
      },
      merklePathTree: function(merklePath) {
        setTimeout(function(){
          var tree = new mapexplorerCore.MerklePathTree(map.find('.merkle-path-tree')[0]);
          tree.display(merklePath);
        });
        return '<div class="merkle-path-tree"></div>';
      },
      argsFmt: function(args) {
        return args.map(function(arg) {
          return JSON.stringify(args, undefined, 2);;
        }).join(', ');
      }
    };

    var builder = new mapexplorerCore.ChainTreeBuilder(this);

    var segmentTemplate = $.templates("#segment-template");

    builder.build({
      id: map.data('mapId'),
      applicationUrl: map.data('applicationUrl'),
      chainscript: map.data('chainscript')
    }, {
      onclick: function(d, onHide) {
        var segment = d.data;

        var refresh = function() {
          map.find('.segment').html(segmentTemplate.render({ segment: segment }, helpers));

          map.find('.nav-link').on('click', function() {
            segment.currentSection = $(this).data('target');
            refresh();
          });

          map.find('a.close').on('click', function(){
            map.find('.segment').html(null);
            onHide();
            return false;
          });
        };

        segment.show = function(target) {
          return this.currentSection === target;
        };

        segment.currentSection = 'state';
        refresh();
      },
      onTag: function(){}
    });
  });
});
