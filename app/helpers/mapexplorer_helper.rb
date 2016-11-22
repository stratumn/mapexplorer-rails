module MapexplorerHelper
  def mapexplorer(application_url: nil, map_id: nil, chainscript: nil)
    render 'mapexplorer', { application_url: application_url, map_id: map_id, chainscript: chainscript }
  end
end
