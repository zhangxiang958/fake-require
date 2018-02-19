(function(global){

  var modules = {}, loadings = [];
  var ifInit = false;
  var basePath;
  var needBase = 1;
  var mainEntry;
  var amd = {};

  amd.require = function(deps, callback){
    var id = amd.getCurrentJs();

    var depIds = deps.map((dep) => {
      return amd.getScriptId(dep);
    });

    if(!modules[id]) {
      modules[id] = {
        id: id,
        state: 0,
        deps: depIds,
        callback: callback,
        exports: null,
        needed: 0
      }

      loadings.unshift(id);
    }
    amd.loadDepModules(id);
  }

  amd.define = function(deps, callback){
    var id = amd.getCurrentJs();

    var depIds = deps.map((dep) => {
      return amd.getScriptId(dep);
    });

    if(!modules[id]) {
      modules[id] = {
        id: id,
        state: 0,
        deps: depIds,
        callback: callback,
        exports: null,
        needed: 0
      }
    }
  }

  amd.loadDepModules = function(id, callback){
    var m = modules[id];
    if(m) {
      m.deps.map((depId) => {
        amd.loadScript(depId, () => {
          // console.log(depId);
          loadings.unshift(depId);
          // console.log(loadings);
          amd.checkDeps();
          amd.loadDepModules(depId);
        });
      });
    }
  }

  amd.checkDeps = function(){
    for(var i = 0; i < loadings.length; i ++) {
      var allLoad = true;
      var id = loadings[i];
      var ret, args;
      amd.checkCycle(id, modules[id].deps, needBase++);
      modules[id].deps.map((dep) => {
        if(!modules[dep] || modules[dep].state === 0) {
          allLoad = false;
          return;
        }
      });

      if(allLoad) {
        loadings.splice(i, 1);
        amd.excute(id);
        amd.checkDeps();
      }
    }
  }

  amd.checkCycle = function(id, deps, num){
    if(modules[id].state !== 1) {
      deps.forEach((depId) => {
        if(modules[depId]) {
          if(modules[depId].needed >= num) {
            throw Error('circul dependency detected');
          } else {
            modules[depId].needed = num;
          }
          if(modules[depId].state !== 1) {
            amd.checkCycle(depId, modules[depId].deps, num);
          }
        }
      });
    }
  }

  amd.excute = function(id){
    var m = modules[id];
    var args = m.deps.map((depId) => {
      return modules[depId].exports;
    });

    var ret = m.callback.apply(global, args);
    if(ret !== void 0) {
      m.exports = ret;
    }
    m.state = 1;
    return ret;
  }

  amd.loadScript = function(url, callback){
    var node = document.createElement('script');
    var head = document.getElementsByTagName('head')[0];
    
    node.type = 'text/javascript';

    node.onload = function(){
      if(callback) callback();
    }

    node.onerror = function(){
      console.log('load ' + url + ' failed.');
    }

    node.src = url;
    head.appendChild(node);
  }

  amd.getScriptId = function(name){
    return basePath + name + '.js';
  }

  amd.getCurrentJs = function(){
    return document.currentScript.src;
  }

  amd.init = function(){
    if(!ifInit) {
      var base = amd.getCurrentJs();
      basePath = base.replace(/[^\/]+\.js/i, '');
      var scripts = document.getElementsByTagName('script');
      var currentScript = scripts[scripts.length - 1];
      var mainjs = currentScript.getAttribute('data-main');
      mainEntry = mainjs;
      ifInit = true;
      amd.loadScript(mainjs, null);
    }
  }
  amd.init();
  window.require = amd.require;
  window.define = amd.define;
}(this));