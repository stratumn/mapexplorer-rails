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
//= require jsrender
//= require @indigocore/mapexplorer-core/dist/mapexplorer-core

document.addEventListener("turbolinks:load", function() {
  var segmentTemplate = $.templates("#segment-template");

  $(".mapexplorer").each(function() {
    var map = $(this);
    var helpers = {
      json: function(val) {
        return JSON.stringify(val, undefined, 2);
      },
      merklePathTree: function(id, merklePath) {
        setTimeout(function() {
          var tree = new mapexplorerCore.MerklePathTree(map.find(`#${id}`)[0]);
          tree.display(merklePath);
        });
        return `<div id="${id}" class="merkle-path-tree"></div>`;
      },
      argsFmt: function(args) {
        return (
          args &&
          args
            .map(function(arg) {
              return JSON.stringify(args, undefined, 2);
            })
            .join(", ")
        );
      },
      bitcoinEvidenceUrl: function(evidence) {
        const tx = evidence.proof.txid;
        let url;

        if (evidence.provider.match(/test/)) {
          url = `https://live.blockcypher.com/btc-testnet/tx/${tx}`;
        } else {
          url = `https://blockchain.info/tx/${tx}`;
        }
        return url;
      },
      validatorsAddressFromVotes: function(votes) {
        return votes.map(v => v.vote.validator_address);
      },
      validatorsAddress: function(validators) {
        return validators.map(v => v.address);
      },
      date: function(timestamp) {
        return new Date(timestamp * 1000).toUTCString();
      }
    };

    var builder = new mapexplorerCore.ChainTreeBuilder(this);

    builder.build(
      {
        id: map.data("mapId"),
        agentUrl: map.data("agentUrl"),
        process: map.data("process"),
        chainscript: map.data("chainscript")
      },
      {
        onclick: function(d, onHide) {
          var segment = d.data;

          var refresh = function() {
            map
              .find(".segment")
              .html(segmentTemplate.render({ segment: segment }, helpers));

            map.find(".nav-link").on("click", function() {
              segment.currentSection = $(this).data("target");
              refresh();
            });

            map.find("a.close").on("click", function() {
              map.find(".segment").html(null);
              onHide();
              return false;
            });
          };

          segment.show = function(target) {
            return this.currentSection === target;
          };

          segment.currentSection = "state";
          refresh();
        },
        onTag: function() {}
      }
    );
  });
});
