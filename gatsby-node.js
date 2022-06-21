const { newCloudinary, getResourceOptions } = require('./utils');

const REPORTER_PREFIX = `gatsby-source-cloudinary`;
const NODE_TYPE = `CloudinaryMedia`;

const getNodeData = (gatsbyUtils, media) => {
  const { createNodeId, createContentDigest } = gatsbyUtils;

  return {
    ...media,
    id: createNodeId(`cloudinary-media-${media.public_id}`),
    parent: null,
    internal: {
      type: NODE_TYPE,
      content: JSON.stringify(media),
      contentDigest: createContentDigest(media),
    },
  };
};

const addTransformations = (resource, transformation, secure) => {
  const splitURL = secure
    ? resource.secure_url.split('/')
    : resource.url.split('/');
  splitURL.splice(6, 0, transformation);

  const transformedURL = splitURL.join('/');
  return transformedURL;
};

const createCloudinaryNodes = async (
  gatsbyUtils,
  cloudinary,
  resourceOptions,
) => {
  const { actions, reporter } = gatsbyUtils;
  const { max_results, results_per_page } = resourceOptions;

  let nextCursor = null;
  let limit = max_results;
  let resultsPerPage = results_per_page;

  do {
    try {
      const result = await cloudinary.api.resources({
        ...resourceOptions,
        max_results: limit < resultsPerPage ? limit : resultsPerPage,
        next_cursor: nextCursor,
      });

      result.resources.forEach((resource) => {
        const transformations = 'q_auto,f_auto'; // Default CL transformations, todo: fetch base transformations from config maybe.

        resource.url = addTransformations(resource, transformations);
        resource.secure_url = addTransformations(
          resource,
          transformations,
          true,
        );

        const nodeData = getNodeData(gatsbyUtils, resource);
        actions.createNode(nodeData);
      });

      if (result.resources.length === 0) {
        reporter.warn(
          `${REPORTER_PREFIX}: No Cloudinary resources found. Try a different query?`,
        );
      } else {
        reporter.info(
          `${REPORTER_PREFIX}: Added ${result.resources.length} ${NODE_TYPE} nodes(s)`,
        );
      }

      nextCursor = result.next_cursor;
      limit = limit - result.resources.length;
    } catch (error) {
      reporter.error(
        `${REPORTER_PREFIX}: Fetching Cloudinary resources failed.`,
        error.error || error,
      );
    }
  } while (nextCursor && limit > 0);
};

exports.sourceNodes = async (gatsbyUtils, pluginOptions) => {
  const cloudinary = newCloudinary(pluginOptions);
  const resourceOptions = getResourceOptions(pluginOptions);

  await createCloudinaryNodes(gatsbyUtils, cloudinary, resourceOptions);
};
