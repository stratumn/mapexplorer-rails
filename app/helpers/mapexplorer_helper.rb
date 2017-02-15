# Copyright (C) 2017  Stratumn SAS
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

module MapexplorerHelper
  def mapexplorer(application_url: nil, map_id: nil, chainscript: nil)
    render 'mapexplorer', { application_url: application_url, map_id: map_id, chainscript: chainscript }
  end
end
