const {
  withAppBuildGradle,
  withGradleProperties,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

function setGradleProperty(properties, key, value) {
  const current = properties.find((property) => property.type === 'property' && property.key === key);
  if (current) {
    current.value = value;
    return;
  }

  properties.push({ type: 'property', key, value });
}

function addOnce(contents, marker, patch) {
  if (contents.includes(marker)) {
    return contents;
  }

  return patch(contents);
}

function addReleaseSigning(contents) {
  const signingMarker = 'CHOWTREK_UPLOAD_STORE_FILE';
  if (contents.includes(signingMarker)) {
    return contents;
  }

  return contents
    .replace(
      '    signingConfigs {\n        debug {',
      `    signingConfigs {
        release {
            if (project.hasProperty('CHOWTREK_UPLOAD_STORE_FILE')) {
                storeFile file(CHOWTREK_UPLOAD_STORE_FILE)
                storePassword CHOWTREK_UPLOAD_STORE_PASSWORD
                keyAlias CHOWTREK_UPLOAD_KEY_ALIAS
                keyPassword CHOWTREK_UPLOAD_KEY_PASSWORD
            }
        }
        debug {`,
    )
    .replace(
      '            signingConfig signingConfigs.debug\n            shrinkResources',
      `            signingConfig project.hasProperty('CHOWTREK_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug
            shrinkResources`,
    );
}

function withChowTrekAndroidBuildFixes(config) {
  config = withGradleProperties(config, (gradleConfig) => {
    setGradleProperty(gradleConfig.modResults, 'newArchEnabled', 'false');
    setGradleProperty(gradleConfig.modResults, 'reactNativeArchitectures', 'arm64-v8a');
    return gradleConfig;
  });

  config = withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = addOnce(
      gradleConfig.modResults.contents,
      "resolutionStrategy.force 'androidx.core:core:1.16.0'",
      (contents) =>
        contents.replace(
          'allprojects {\n',
          "allprojects {\n  configurations.configureEach {\n    resolutionStrategy.force 'androidx.core:core:1.16.0', 'androidx.core:core-ktx:1.16.0'\n  }\n\n",
        ),
    );

    return gradleConfig;
  });

  config = withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = addReleaseSigning(gradleConfig.modResults.contents);

    gradleConfig.modResults.contents = addOnce(
      gradleConfig.modResults.contents,
      'patchExpoAutolinkingPackage',
      (contents) => `${contents}

def patchExpoAutolinkingPackage = tasks.register("patchExpoAutolinkingPackage") {
    dependsOn("generateAutolinkingPackageList")

    doLast {
        def packageList = file("$buildDir/generated/autolinking/src/main/java/com/facebook/react/PackageList.java")
        if (packageList.exists()) {
            def source = packageList.getText("UTF-8")
            def patched = source.replace("import expo.core.ExpoModulesPackage;", "import expo.modules.ExpoModulesPackage;")
            if (source != patched) {
                packageList.write(patched, "UTF-8")
            }
        }
    }
}

tasks.withType(JavaCompile).configureEach {
    dependsOn(patchExpoAutolinkingPackage)
}
`,
    );

    return gradleConfig;
  });

  return config;
}

module.exports = withChowTrekAndroidBuildFixes;
