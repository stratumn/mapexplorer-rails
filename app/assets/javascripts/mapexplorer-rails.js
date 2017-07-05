/*
  Copyright 2017 Stratumn SAS. All rights reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

//= require jquery
//= require turbolinks
//= require d3
//= require jsrender
//= require dist/mapexplorer-core

document.addEventListener('turbolinks:load', function() {

  var segmentTemplate = $.templates("#segment-template");

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
