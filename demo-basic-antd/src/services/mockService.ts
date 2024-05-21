import { material, project } from '@alilc/lowcode-engine';
import { filterPackages } from '@alilc/lowcode-plugin-inject'
import { Message, Dialog } from '@alifd/next';
import { IPublicEnumTransformStage } from '@alilc/lowcode-types';
import schema from './schema.json';

import axios from 'axios';

export const saveSchema = async (scenarioName: string = 'unknown') => {
  await setProjectSchemaToLocalStorage(scenarioName);
  await setPackagesToLocalStorage(scenarioName);
  Message.success('成功保存到本地');
};

export const resetSchema = async (scenarioName: string = 'unknown') => {
  try {
    await new Promise<void>((resolve, reject) => {
      Dialog.confirm({
        content: '确定要重置吗？您所有的修改都将消失！',
        onOk: () => {
          resolve();
        },
        onCancel: () => {
          reject()
        },
      })
    })
  } catch(err) {
    return;
  }

  let defaultSchema = schema || {
    componentsTree: [{ componentName: 'Page', fileName: 'sample' }],
    componentsMap: material.componentsMap,
    version: '1.0.0',
    i18n: {},
  };

  project.getCurrentDocument()?.importSchema(defaultSchema as any);
  project.simulatorHost?.rerender();

  await setProjectSchemaToLocalStorage(scenarioName);
  await setPackagesToLocalStorage(scenarioName);
  Message.success('成功重置页面');
}

const getLSName = (scenarioName: string, ns: string = 'projectSchema') => `${scenarioName}:${ns}`;

export const getProjectSchemaFromLocalStorage = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }

  let response = await axios.get("http://localhost:8080/api/page/detail",{params:{pageCode:window.lowcode.pageCode}});

  console.log(response);
  let schema = response.data.schema || '{}';
  let assets = response.data.assets ||  '[]';
  
  window.localStorage.setItem(
    getLSName(scenarioName),
    schema
  );
  return JSON.parse(window.localStorage.getItem(getLSName(scenarioName)) || '{}');
}


const setProjectSchemaToLocalStorage = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  let schema = JSON.stringify(project.exportSchema(IPublicEnumTransformStage.Save));
  window.localStorage.setItem(
    getLSName(scenarioName),
    JSON.stringify(project.exportSchema(IPublicEnumTransformStage.Save))
  );

  
  const packages = await filterPackages(material.getAssets().packages);

  //保存资源
  axios.post("http://localhost:8080/api/page/save",{
    appCode: window.lowcode?.appCode,
    pageCode: window.lowcode?.pageCode,
    schema:schema,
    assets:JSON.stringify(packages)
  }).then(res=>{
    console.log("保存结果是:{}",res.data);
  })

}

const setPackagesToLocalStorage = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const packages = await filterPackages(material.getAssets().packages);
  window.localStorage.setItem(
    getLSName(scenarioName, 'packages'),
    JSON.stringify(packages),
  );
}

export const getPackagesFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  return JSON.parse(window.localStorage.getItem(getLSName(scenarioName, 'packages')) || '{}');
}

export const getPageSchema = async (scenarioName: string = 'unknown') => {
  let result = await getProjectSchemaFromLocalStorage(scenarioName);
  const pageSchema = result.componentsTree?.[0];

  if (pageSchema) {
    return pageSchema;
  }

  return schema;
};
