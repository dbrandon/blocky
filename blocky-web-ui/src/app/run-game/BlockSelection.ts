
export class BlockSelection {
  static TYPE_GRASS = 0;
  static TYPE_DIRT = 1;
  static TYPE_STONE = 2;
  static TYPE_COAL = 3;
  static TYPE_DOOR = 100;

  private static BASE_URL = '/assets/kennynl/voxel_pack';

  static makeSelectionList() {
    return [
      new BlockSelection(BlockSelection.TYPE_GRASS, BlockSelection.BASE_URL + '/grass_top.png'),
      new BlockSelection(BlockSelection.TYPE_DIRT, BlockSelection.BASE_URL + '/dirt.png'),
      new BlockSelection(BlockSelection.TYPE_STONE, BlockSelection.BASE_URL + '/stone.png'),
      new BlockSelection(BlockSelection.TYPE_COAL, BlockSelection.BASE_URL + '/stone_coal.png'),
      new BlockSelection(BlockSelection.TYPE_DOOR, BlockSelection.BASE_URL + '/trunk_side.png')
    ]
  }

  constructor(private blockType_: number, private imgUrl_: string) {

  }

  get blockType() {
    return this.blockType_;
  }

  get imgUrl() {
    return this.imgUrl_;
  }
}