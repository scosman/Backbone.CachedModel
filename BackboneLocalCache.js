
// by Steve Cosman
// source: https://github.com/scosman/Backbone.CachedModel
// see README for details

// set of helper funtions
Backbone.BackboneLocalCache = Backbone.BackboneLocalCache || {};

Backbone.BackboneLocalCache.generateKey = function(model)
  {
    if (model == null || model.cacheName == null || model.cacheName.length < 1 || model.id == null || model.id <= 0)
    {
      // can not generate a ID for this model
      return null;
    }
    return "BACKBONE_CACHE::" + model.cacheName + "::" + model.id;
  };

Backbone.BackboneLocalCache.syncAndCacheModel = function(method, model, options)
  {
    var cacheKey = Backbone.BackboneLocalCache.generateKey(model);

    if (cacheKey != null)
    {
      var superSuccess = options.success;
      options.success = function(modelAttr, resp)
      {
        localStorage.setItem(cacheKey, JSON.stringify(modelAttr));
        superSuccess(modelAttr, resp);
      };
    }

    return Backbone.sync(method, model, options);
  };

// new sync function, used by CachedModel. Relies on Backbone.sync so don't set 
// Backbone.sync to this unless you want infinite recursion
Backbone.cachedSync = function(method, model, options) {
  var cacheKey = Backbone.BackboneLocalCache.generateKey(model);

  if (method == "read")
  {
    // first check the cache
    var cached = localStorage.getItem(cacheKey);
    if (cached != null )
    {
      var cachedModel = JSON.parse(cached);
      options.success(cachedModel, "success");
      return null;
    }
    else 
    {
      return Backbone.BackboneLocalCache.syncAndCacheModel(method, model, options);
    }
  }
  else if (method == "create" || method == "update")
  {
    return Backbone.BackboneLocalCache.syncAndCacheModel(method, model, options);
  }
  else if (method == "delete")
  {
    localStorage.removeItem(cacheKey);
    return Backbone.sync(method, model, options);
  }
};

// extend this to get all the localstorage goodness
Backbone.CachedModel = Backbone.Model.extend({
  // TODO P0 initialize - add to cache when created if it has an id attribute
  initialize: function (attributes)
  {
    if (this.cacheName == null || this.cacheName.length < 1)
    {
      // a cached model requires a cacheName. revert to a normal model
      this.sync = null;
    }
    Backbone.Model.prototype.initialize.call(attributes);
  },

  sync: Backbone.cachedSync,
});

